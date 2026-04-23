import type { MetadataRoute } from "next";
import { APP_NAME, WEB_APP_NAME } from "@/lib/brand";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: WEB_APP_NAME,
    short_name: APP_NAME,
    description:
      `${WEB_APP_NAME} converts A4 shipping labels into 4×6 thermal-printer labels in your browser.`,
    start_url: "/web",
    scope: "/web",
    display: "standalone",
    background_color: "#f3efe6",
    theme_color: "#14322f",
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
    categories: ["business", "productivity", "utilities"],
    lang: "en",
    dir: "ltr",
  };
}
