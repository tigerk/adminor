import { spawn } from "node:child_process";
import { createServer } from "vite";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const PORT = 7001;

async function startVite() {
  const server = await createServer({
    configFile: "./vite.config.ts",
    mode: "development",
    server: {
      port: PORT,
      host: "0.0.0.0",
      strictPort: true
    }
  });

  await server.listen();

  console.log(`\n✅ Vite dev server is running at http://localhost:${PORT}\n`);

  return server;
}

async function startElectron() {
  // 🔥 关键修改：使用 dist-electron/main.js 而不是 '.'
  const electronPath = process.platform === "win32" ? "node_modules/electron/dist/electron.exe" : "node_modules/.bin/electron";

  const mainPath = join(__dirname, "dist-electron/main.js");

  const electronProcess = spawn(electronPath, [mainPath], {
    env: {
      ...process.env,
      NODE_ENV: "development",
      VITE_DEV_SERVER_URL: `http://localhost:${PORT}`,
      BUILD_TARGET: "electron",
      VITE_PORT: PORT.toString()
    },
    stdio: "inherit"
  });

  electronProcess.on("close", code => {
    console.log(`Electron exited with code ${code}`);
    process.exit(code || 0);
  });

  return electronProcess;
}

async function buildElectron() {
  console.log("🔨 Building Electron main process...");

  const { build } = await import("vite");

  try {
    // 构建主进程
    await build({
      configFile: false,
      mode: "development",
      build: {
        outDir: "dist-electron",
        emptyOutDir: false,
        minify: false,
        sourcemap: true,
        lib: {
          entry: "electron/main.ts",
          formats: ["es"],
          fileName: () => "main.js"
        },
        rollupOptions: {
          external: ["electron", "path", "url", "node:path", "node:url"]
        }
      },
      define: {
        "process.env.NODE_ENV": JSON.stringify("development"),
        "process.env.VITE_PORT": JSON.stringify(PORT.toString())
      }
    });

    console.log("✅ Main process built\n");

    // 构建 preload
    await build({
      configFile: false,
      mode: "development",
      build: {
        outDir: "dist-electron",
        emptyOutDir: false,
        minify: false,
        sourcemap: true,
        lib: {
          entry: "electron/preload.ts",
          formats: ["cjs"],
          fileName: () => "preload.js"
        },
        rollupOptions: {
          external: ["electron"]
        }
      }
    });

    console.log("✅ Preload script built\n");
    console.log("✅ Electron build complete\n");
  } catch (error) {
    console.error("❌ Build failed:", error);
    console.error(error.stack);
    throw error;
  }
}

(async () => {
  try {
    // 1. 先构建 Electron 主进程
    await buildElectron();

    // 2. 启动 Vite 开发服务器
    console.log("🚀 Starting Vite dev server...");
    await startVite();

    // 3. 等待确保 Vite 完全启动
    await new Promise(resolve => setTimeout(resolve, 2000));

    // 4. 启动 Electron
    console.log("🚀 Starting Electron...");
    await startElectron();
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
})();
