import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Croplet Web",
    short_name: "Croplet",
    description:
      "Croplet Web converts A4 shipping labels into 4×6 thermal-printer labels in your browser.",
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
