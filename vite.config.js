import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  assetsInclude: ["**/*.glb"],
  build: {
    rollupOptions: {
      input: {
        main: "index.html",
        resume: "resume.html",
        certifications: "certifications.html",
      },
    },
  },
});
