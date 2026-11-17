/** @type {import('next').NextConfig} */
const supabaseOrigin = (() => {
  try {
    const value = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (!value) return "";
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:" ? url.origin : "";
  } catch {
    return "";
  }
})();

const supabaseWebSocketOrigin = supabaseOrigin
  .replace(/^https:/, "wss:")
  .replace(/^http:/, "ws:");

const contentSecurityPolicyReportOnly = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  `img-src 'self' data: blob:${supabaseOrigin ? ` ${supabaseOrigin}` : ""}`,
  `connect-src 'self'${supabaseOrigin ? ` ${supabaseOrigin} ${supabaseWebSocketOrigin}` : ""}`,
  "font-src 'self' data:",
  "media-src 'self' blob: data:",
  "frame-src 'self'",
].join("; ");

const nextConfig = {
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()",
          },
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          // Enforce only the anti-framing directive while the broader CSP is report-only.
          {
            key: "Content-Security-Policy",
            value: "frame-ancestors 'none'",
          },
          {
            key: "Content-Security-Policy-Report-Only",
            value: contentSecurityPolicyReportOnly,
          },
        ],
      },
    ];
  },
};

export default nextConfig;
