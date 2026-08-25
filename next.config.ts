import { withPayload } from "@payloadcms/next/withPayload";
import type { NextConfig } from "next";
import path from "path";
import { fileURLToPath } from "url";

const dirname = path.dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  async redirects() {
    return [
      // Short alias — permanent: false (307) since the canonical URL structure isn't
      // final yet; a 308 would get cached hard by browsers and be awkward to undo.
      // Next forwards the query string automatically (e.g. /om?tab=metrics -> /orders_manager?tab=metrics).
      {
        source: "/om",
        destination: "/orders_manager",
        permanent: false,
      },
    ]
  },
  turbopack: {
    resolveAlias: {
      "@": path.join(dirname, "src"),
    },
  },
  images: {
    qualities: [70, 75, 92, 95, 100],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "voadlunanvzbxntyalhv.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
};

export default withPayload(nextConfig);
