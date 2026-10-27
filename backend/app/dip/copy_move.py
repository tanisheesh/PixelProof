r"""
Layer 3: Copy-Move (Clone) Forgery Detection — Hybrid Keypoint + Dense Block-DCT Pipeline.

Mathematical Basis:
Copy-move forgery copies a region R_1(x, y) and pastes it at R_2(x + \Delta x, y + \Delta y) within the same image.
Because both regions share the exact same camera noise, color palette, and JPEG compression history,
ELA and noise analysis alone may miss them. PixelProof combines two orthogonal DIP detectors:
1. Dense Overlapping Block 2D-DCT Lexicographical Matching (Fridrich et al.):
   - Extracts quantized low-frequency 2D-DCT feature vectors from sliding B x B blocks.
   - Lexicographically sorts feature rows so identical/near-identical blocks become adjacent in O(N log N).
   - Accumulates shift vectors (\Delta x, \Delta y) in a 2D displacement histogram and filters dominant translation clusters.
2. ORB Keypoint Descriptor Matching + Spatial Shift Verification:
   - Extracts rotation/scale-invariant binary descriptors and matches via Hamming distance with minimum spatial separation.
"""

from collections import Counter
from typing import List, Literal, Tuple
import cv2
import numpy as np

from app.core.schemas import CloneVector, DipMathInfo, LayerResult
from app.dip.preprocessing import rgb_to_luminance_float
from app.utils.encoding import (
    apply_colormap_to_map,
    compute_compact_histogram,
    normalize_to_uint8,
    rgb_to_base64_data_url,
)


def run_copy_move_layer(
    rgb: np.ndarray,
    similarity_threshold: float = 0.88,
    colormap: Literal["inferno", "viridis", "jet", "hot"] = "inferno",
) -> Tuple[LayerResult, np.ndarray, List[CloneVector]]:
    """
    Detect internal cloned regions using Hybrid Dense Block-DCT Lexicographical Sorting + ORB Keypoint Matching.
    Returns (LayerResult, normalized_spatial_map_float_0_to_1, clone_vectors).
    """
    lum = rgb_to_luminance_float(rgb)
    h, w = lum.shape
    clone_mask = np.zeros((h, w), dtype=np.float32)
    clone_vectors: List[CloneVector] = []

    # --- PART A: Dense Overlapping Block 2D-DCT Lexicographical Matching ---
    block_size = 16
    stride = 6
    min_dist = 42.0

    ys = list(range(0, h - block_size + 1, stride))
    xs = list(range(0, w - block_size + 1, stride))

    features = []
    coords = []

    n = block_size
    k_idx = np.arange(n, dtype=np.float32)[:, None]
    i_idx = np.arange(n, dtype=np.float32)[None, :]
    dct_mat = np.cos(np.pi * (2 * i_idx + 1) * k_idx / (2.0 * n))
    dct_mat[0, :] *= np.sqrt(1.0 / n)
    dct_mat[1:, :] *= np.sqrt(2.0 / n)
    dct_sub = dct_mat[:4, :]  # 4 x 16 (16-D DCT feature vector)

    for y in ys:
        for x in xs:
            patch = lum[y : y + block_size, x : x + block_size]
            # Require meaningful internal texture variance so smooth sky/ground gradients don't self-match
            patch_std = float(np.std(patch))
            if patch_std < 11.5:
                continue
            # Also check gradient complexity (avoid simple 1D edges matching everywhere along a straight line)
            gx_val = float(np.std(patch[:, 1:] - patch[:, :-1]))
            gy_val = float(np.std(patch[1:, :] - patch[:-1, :]))
            if min(gx_val, gy_val) < 4.8:
                continue

            c4 = dct_sub @ (patch - np.mean(patch)) @ dct_sub.T
            vec = c4.ravel()
            # Keep raw quantized low-frequency 3x3 DCT coefficients (9-D vector) for robust lexicographical sorting
            vec_quant = np.round(vec[:9] / 9.0).astype(np.int16)
            features.append(vec_quant)
            coords.append((x, y))

    dct_cluster_matches = 0
    if len(features) > 20:
        feat_arr = np.array(features, dtype=np.int16)
        coord_arr = np.array(coords, dtype=np.int32)

        sort_keys = [feat_arr[:, i] for i in range(feat_arr.shape[1] - 1, -1, -1)]
        order = np.lexsort(sort_keys)
        sorted_feats = feat_arr[order]
        sorted_coords = coord_arr[order]

        k_neighbors = min(14, len(sorted_feats) - 1)
        max_l2_dist = max(2.0, (1.0 - similarity_threshold) * 38.0)

        shift_buckets: Counter = Counter()
        candidate_pairs = []

        for idx in range(len(sorted_feats) - 1):
            f1 = sorted_feats[idx].astype(np.float32)
            x1, y1 = int(sorted_coords[idx, 0]), int(sorted_coords[idx, 1])

            for offset in range(1, k_neighbors + 1):
                if idx + offset >= len(sorted_feats):
                    break
                f2 = sorted_feats[idx + offset].astype(np.float32)
                dist_feat = float(np.linalg.norm(f1 - f2))
                if dist_feat > max_l2_dist:
                    continue

                x2, y2 = int(sorted_coords[idx + offset, 0]), int(sorted_coords[idx + offset, 1])
                spatial_dist = float(np.hypot(x2 - x1, y2 - y1))
                if spatial_dist < min_dist:
                    continue

                # Also verify direct pixel-level Normalized Cross-Correlation / MAE between patches
                p1 = lum[y1 : y1 + block_size, x1 : x1 + block_size]
                p2 = lum[y2 : y2 + block_size, x2 : x2 + block_size]
                mae = float(np.mean(np.abs(p1 - p2)))
                if mae > 9.5:
                    continue

                if x1 < x2 or (x1 == x2 and y1 < y2):
                    sx, sy, tx, ty = x1, y1, x2, y2
                else:
                    sx, sy, tx, ty = x2, y2, x1, y1

                dx = int(round((tx - sx) / float(stride))) * stride
                dy = int(round((ty - sy) / float(stride))) * stride
                shift_buckets[(dx, dy)] += 1
                candidate_pairs.append((sx, sy, tx, ty, (dx, dy), mae))

        # Require at least 8 spatially coherent blocks sharing the exact same shift vector (\Delta x, \Delta y)
        dominant_shifts = {shift for shift, count in shift_buckets.most_common(3) if count >= 8}
        if dominant_shifts:
            verified_pairs = [p for p in candidate_pairs if p[4] in dominant_shifts]
            dct_cluster_matches = len(verified_pairs)
            for sx, sy, tx, ty, (dx, dy), mae in verified_pairs:
                conf = float(np.clip(1.0 - mae / 12.0, 0.45, 1.0))
                clone_mask[sy : sy + block_size, sx : sx + block_size] = np.maximum(
                    clone_mask[sy : sy + block_size, sx : sx + block_size], conf
                )
                clone_mask[ty : ty + block_size, tx : tx + block_size] = np.maximum(
                    clone_mask[ty : ty + block_size, tx : tx + block_size], conf
                )

            step_vec = max(1, len(verified_pairs) // 16)
            for sx, sy, tx, ty, (dx, dy), mae in verified_pairs[::step_vec][:16]:
                clone_vectors.append(
                    CloneVector(
                        src_x=int(sx + block_size // 2),
                        src_y=int(sy + block_size // 2),
                        dst_x=int(tx + block_size // 2),
                        dst_y=int(ty + block_size // 2),
                        shift_dx=int(dx),
                        shift_dy=int(dy),
                        score=round(float(np.clip(1.0 - mae / 14.0, 0.65, 0.99)), 2),
                        method="block_dct",
                    )
                )

    # --- PART B: ORB Keypoint Descriptor Matching ---
    gray_u8 = lum.astype(np.uint8)
    orb = cv2.ORB_create(nfeatures=900, scaleFactor=1.2, nlevels=8)
    keypoints, descriptors = orb.detectAndCompute(gray_u8, None)

    orb_verified_count = 0
    if descriptors is not None and len(keypoints) >= 12:
        bf = cv2.BFMatcher(cv2.NORM_HAMMING, crossCheck=False)
        knn_matches = bf.knnMatch(descriptors, descriptors, k=4)

        kp_shifts: Counter = Counter()
        kp_candidates = []
        for match_list in knn_matches:
            if len(match_list) < 2:
                continue
            for m in match_list[1:]:
                if m.distance > 22:  # Strict Hamming distance for genuine keypoint clones
                    continue
                pt1 = keypoints[m.queryIdx].pt
                pt2 = keypoints[m.trainIdx].pt
                s_dist = float(np.hypot(pt2[0] - pt1[0], pt2[1] - pt1[1]))
                if s_dist < min_dist:
                    continue
                if pt1[0] < pt2[0] or (pt1[0] == pt2[0] and pt1[1] < pt2[1]):
                    p_src, p_dst = pt1, pt2
                else:
                    p_src, p_dst = pt2, pt1
                q_dx = int(round((p_dst[0] - p_src[0]) / 8.0)) * 8
                q_dy = int(round((p_dst[1] - p_src[1]) / 8.0)) * 8
                kp_shifts[(q_dx, q_dy)] += 1
                kp_candidates.append((p_src, p_dst, (q_dx, q_dy), m.distance))
                break

        valid_kp_shifts = {sh for sh, cnt in kp_shifts.most_common(2) if cnt >= 6}
        for p_src, p_dst, sh, ham_dist in kp_candidates:
            if sh in valid_kp_shifts:
                orb_verified_count += 1
                sx_i, sy_i = int(round(p_src[0])), int(round(p_src[1]))
                tx_i, ty_i = int(round(p_dst[0])), int(round(p_dst[1]))
                cv2.circle(clone_mask, (sx_i, sy_i), 16, 0.9, -1)
                cv2.circle(clone_mask, (tx_i, ty_i), 16, 0.9, -1)
                if len(clone_vectors) < 24:
                    clone_vectors.append(
                        CloneVector(
                            src_x=sx_i,
                            src_y=sy_i,
                            dst_x=tx_i,
                            dst_y=ty_i,
                            shift_dx=sh[0],
                            shift_dy=sh[1],
                            score=round(float(1.0 - ham_dist / 64.0), 2),
                            method="keypoint_orb",
                        )
                    )

    if np.max(clone_mask) > 0:
        clone_mask = cv2.GaussianBlur(clone_mask, (15, 15), 3.5)

    norm_u8 = normalize_to_uint8(clone_mask, clip_percentile=99.5)
    heatmap_rgb = apply_colormap_to_map(norm_u8, colormap=colormap)

    for vec in clone_vectors[:20]:
        cv2.line(heatmap_rgb, (vec.src_x, vec.src_y), (vec.dst_x, vec.dst_y), (0, 255, 220), 2, cv2.LINE_AA)
        cv2.circle(heatmap_rgb, (vec.src_x, vec.src_y), 4, (16, 185, 129), -1, cv2.LINE_AA)
        cv2.circle(heatmap_rgb, (vec.dst_x, vec.dst_y), 4, (244, 63, 94), -1, cv2.LINE_AA)

    heatmap_b64 = rgb_to_base64_data_url(heatmap_rgb)

    cloned_area_pct = float(np.mean(clone_mask > 0.25)) * 100.0
    raw_score = (
        min(65.0, dct_cluster_matches * 2.5)
        + min(60.0, orb_verified_count * 2.2)
        + min(25.0, cloned_area_pct * 3.8)
    )
    score = round(float(np.clip(raw_score if raw_score > 6.0 else 4.5, 4.5, 99.0)), 1)

    if score >= 55.0:
        status = "tampered"
        summary = (
            f"Copy-Move clone clusters detected: {dct_cluster_matches} DCT block pairs and "
            f"{orb_verified_count} keypoint pairs share coherent translation vectors."
        )
    elif score >= 28.0:
        status = "suspicious"
        summary = (
            f"Potential repetitive or cloned structures detected ({dct_cluster_matches} DCT pairs, "
            f"{orb_verified_count} ORB matches)."
        )
    else:
        status = "clean"
        summary = "No coherent internal translation or copy-move region duplication detected."

    findings = [
        f"Evaluated {len(features)} textured {block_size}\u00d7{block_size} 2D-DCT blocks via lexicographical sorting.",
        f"Coherent shift-vector histogram clusters: {dct_cluster_matches} block-DCT pairs and {orb_verified_count} ORB keypoint pairs.",
        f"Duplicated spatial footprint covers {cloned_area_pct:.2f}% of the frame.",
    ]

    dip_math = DipMathInfo(
        signal_domain="2D Discrete Cosine Transform (DCT) & Keypoint Descriptors",
        algorithm_name="Lexicographically Sorted 2D-DCT Block Matching + ORB Shift-Vector Clustering",
        latex_formula=r"F(u,v) = \alpha(u)\alpha(v)\sum_{x=0}^{B-1}\sum_{y=0}^{B-1} f(x,y)\cos\frac{(2x+1)u\pi}{2B}\cos\frac{(2y+1)v\pi}{2B}, \quad \mathbf{s}_{ij} = \mathbf{p}_i - \mathbf{p}_j",
        parameters_used={
            "dct_block_size": f"{block_size}x{block_size} (stride {stride})",
            "zigzag_feature_dims": "4x4 low-frequency DCT sub-matrix (16 coefficients)",
            "min_spatial_separation_px": min_dist,
            "similarity_threshold": similarity_threshold,
        },
        interpretation_guide=(
            "Cyan vector lines connect a source patch (green dot) to its cloned destination (red dot). "
            "Coherent parallel vectors prove that a region was copied and pasted to duplicate or conceal an object."
        ),
    )

    spatial_01 = np.clip(clone_mask, 0.0, 1.0)
    result = LayerResult(
        id="copy_move",
        name="Layer 3: Copy-Move (Clone) Forgery Detection (DCT + ORB)",
        short_name="Copy-Move",
        score=score,
        weight=0.22,
        status=status,
        summary=summary,
        finding_details=findings,
        heatmap_base64=heatmap_b64,
        histogram_data=compute_compact_histogram(norm_u8),
        metrics={
            "dct_matched_blocks": dct_cluster_matches,
            "orb_matched_keypoints": orb_verified_count,
            "cloned_area_pct": round(cloned_area_pct, 2),
            "vector_count": len(clone_vectors),
        },
        dip_math=dip_math,
    )
    return result, spatial_01, clone_vectors
