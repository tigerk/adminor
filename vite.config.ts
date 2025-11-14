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
      }
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
                  // 启动 Electron
                  args.startup();
                },
                vite: {
                  build: {
                    outDir: "dist-electron",
                    rollupOptions: {
                      external: ["electron"],
                      output: {
                        format: "es"
                      }
                    }
                  }
                }
              },
              {
                // 预加载脚本
                entry: "electron/preload.ts",
                onstart(options) {
                  options.reload();
                },
                vite: {
                  build: {
                    outDir: "dist-electron",
                    rollupOptions: {
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
    build: {
      target: "es2015",
      sourcemap: false,
      chunkSizeWarningLimit: 4000,
      rollupOptions: isElectron
        ? {
            // Electron 模式不打包，留空
            input: {}
          }
        : {
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
