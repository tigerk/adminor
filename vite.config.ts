import { getPluginsList } from "./build/plugins";
import { include, exclude } from "./build/optimize";
import { type UserConfigExport, type ConfigEnv, loadEnv } from "vite";
import { root, alias, wrapperEnv, pathResolve, __APP_INFO__ } from "./build/utils";
import electron from "vite-plugin-electron";
import electronRenderer from "vite-plugin-electron-renderer";

export default ({ mode }: ConfigEnv): UserConfigExport => {
  const { VITE_CDN, VITE_PORT, VITE_COMPRESSION, VITE_PUBLIC_PATH } = wrapperEnv(loadEnv(mode, root));

  // 判断是否为 Electron 环境
  const isElectron = process.env.BUILD_TARGET === "electron";
  const isDev = mode === "development";

  return {
    base: isElectron ? "./" : VITE_PUBLIC_PATH,
    root,
    resolve: {
      alias
    },
    server: {
      port: VITE_PORT,
      host: "0.0.0.0",
      proxy: {
        "/api": {
          target: "http://127.0.0.1:8887",
          changeOrigin: true,
          rewrite: path => path.replace(/^\/api/, "")
        }
      },
      warmup: {
        clientFiles: ["./index.html", "./src/{views,components}/*"]
      },
      // 🔥 添加 watch 配置（针对 Electron）
      watch: isElectron
        ? {
            ignored: ["**/dist-electron/**"]
          }
        : undefined
    },
    plugins: [
      ...getPluginsList(VITE_CDN, VITE_COMPRESSION),
      // Electron 插件
      ...(isElectron
        ? [
            electron([
              {
                // 主进程入口
                entry: "electron/main.ts",
                onstart(args) {
                  if (isDev) {
                    // 启动 Electron
                    args.startup();
                  }
                },
                vite: {
                  build: {
                    outDir: "dist-electron",
                    minify: false,
                    sourcemap: isDev,
                    rollupOptions: {
                      external: ["electron", "path", "url", "node:path", "node:url"],
                      output: {
                        format: "es"
                      }
                    }
                  },
                  define: {
                    "process.env.NODE_ENV": JSON.stringify(mode),
                    "process.env.VITE_PORT": JSON.stringify(VITE_PORT)
                  }
                }
              },
              {
                // 预加载脚本
                entry: "electron/preload.ts",
                onstart(options) {
                  if (isDev) {
                    options.reload();
                  }
                },
                vite: {
                  build: {
                    outDir: "dist-electron",
                    minify: false,
                    sourcemap: isDev,
                    rollupOptions: {
                      external: ["electron"],
                      output: {
                        format: "cjs"
                      }
                    }
                  }
                }
              }
            ]),
            electronRenderer()
          ]
        : [])
    ],
    optimizeDeps: {
      include,
      exclude
    },
    build: isElectron
      ? {} // Skip main build in Electron mode (URL-only)
      : {
          target: "es2015",
          sourcemap: false,
          chunkSizeWarningLimit: 4000,
          rollupOptions: {
            input: {
              index: pathResolve("./index.html", import.meta.url)
            },
            output: {
              chunkFileNames: "static/js/[name]-[hash].js",
              entryFileNames: "static/js/[name]-[hash].js",
              assetFileNames: "static/[ext]/[name]-[hash].[ext]"
            }
          }
        },
    define: {
      __INTLIFY_PROD_DEVTOOLS__: false,
      __APP_INFO__: JSON.stringify(__APP_INFO__)
    }
  };
};
