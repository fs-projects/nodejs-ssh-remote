import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";

// https://vitejs.dev/config/
export default defineConfig(({ command, mode, isSsrBuild, isPreview }) => {
  console.log("Vite config", command, mode, isSsrBuild, isPreview);
  return {
    plugins: [react()],
    server: {
      proxy: {
        "/ssh-servers": {
          target: "http://localhost:4000/ssh-all-servers", // Your backend server address
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/ssh-servers/, ""),
        },
      },
    },
  };
});
