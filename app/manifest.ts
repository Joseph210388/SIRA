import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "SIRA",
    short_name: "SIRA",
    description: "Ingresos, gastos y ahorro",
    start_url: "/",
    display: "standalone",
    background_color: "#f6f8f6",
    theme_color: "#1f7a4d",
    lang: "es",
    icons: [{ src: "/icon", sizes: "512x512", type: "image/png", purpose: "any" }],
  };
}
