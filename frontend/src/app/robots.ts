import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
    },
    sitemap: "https://pixelproof.tanisheesh.in/sitemap.xml",
    host: "https://pixelproof.tanisheesh.in",
  };
}
