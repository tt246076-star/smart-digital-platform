import type { MetadataRoute } from "next";

const SITE_URL = "https://bitaqati.online";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: ["/", "/p/", "/vip/"],
      disallow: [
        "/admin/",
        "/dashboard/",
        "/login",
        "/signup",
        "/auth/",
        "/api/",
        "/settings/",
        "/forgot-password",
        "/reset-password",
        "/pages/",
        "/vip/new",
      ],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
