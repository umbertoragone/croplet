import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  async redirects() {
    return [
      {
        // Matches the root of web.croplet.app
        source: "/",
        has: [
          {
            type: "host",
            value: "web.croplet.app",
          },
        ],
        destination: "https://croplet.app/web",
        permanent: true,
      },
      {
        // Matches any sub-paths (e.g., web.croplet.app/info -> croplet.app/web/info)
        source: "/:path*",
        has: [
          {
            type: "host",
            value: "web.croplet.app",
          },
        ],
        destination: "https://croplet.app/web/:path*",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
