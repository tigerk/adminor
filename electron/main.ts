import { app, BrowserWindow, shell } from "electron";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 🔥 添加：在文件顶部立即打印环境变量
console.log("=== Electron Main Process Started ===");
console.log("Environment Variables:");
console.log("  NODE_ENV:", process.env.NODE_ENV);
console.log("  VITE_DEV_SERVER_URL:", process.env.VITE_DEV_SERVER_URL);
console.log("  BUILD_TARGET:", process.env.BUILD_TARGET);
console.log("  VITE_PORT:", process.env.VITE_PORT);
console.log("  __dirname:", __dirname);
console.log("=====================================\n");

let mainWindow: BrowserWindow | null = null;

function createWindow() {
  console.log("Creating Electron window...");

  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    show: false,
    autoHideMenuBar: true,
    webPreferences: {
      preload: join(__dirname, "preload.js"),
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: false,
      allowRunningInsecureContent: true
    }
  });

  // 🔥 URL-only 模式：始终从 URL 加载，不使用本地文件
  let loadURL: string;

  if (process.env.VITE_DEV_SERVER_URL) {
    // 开发环境：使用 vite-plugin-electron 注入的 dev server URL
    loadURL = process.env.VITE_DEV_SERVER_URL;
    console.log("✅ Development: Using VITE_DEV_SERVER_URL:", loadURL);
  } else if (process.env.NODE_ENV === "development") {
    // 开发环境回退：手动构造 localhost URL
    const port = process.env.VITE_PORT || "7001";
    loadURL = `http://localhost:${port}`;
    console.log("⚠️ Development: VITE_DEV_SERVER_URL not found, using fallback:", loadURL);
  } else {
    // 生产环境：加载已部署的 Web 应用 URL
    //: 配置生产环境的 Web 应用地址
    loadURL = process.env.VITE_PRODUCTION_URL || "http://localhost:7001";
    console.log("📦 Production: Loading from URL:", loadURL);
    console.log("⚠️ Remember to set VITE_PRODUCTION_URL in .env.production");
  }

  console.log("🌐 Final URL to load:", loadURL);
  console.log("⏳ Loading...\n");

  mainWindow.loadURL(loadURL).catch(err => {
    console.error("❌ Error loading URL:", err);
  });

  mainWindow.webContents.openDevTools();

  mainWindow.webContents.on("did-start-loading", () => {
    console.log("⏳ Started loading...");
  });

  mainWindow.webContents.on("did-fail-load", (event, errorCode, errorDescription, validatedURL) => {
    console.error("❌ Failed to load:", validatedURL);
    console.error("   Error code:", errorCode);
    console.error("   Description:", errorDescription);
  });

  mainWindow.webContents.on("did-finish-load", () => {
    console.log("✅ Page loaded successfully!");
    console.log("   Current URL:", mainWindow?.webContents.getURL());
  });

  mainWindow.once("ready-to-show", () => {
    console.log("👁️ Window ready to show");
    mainWindow?.show();
  });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith("http")) {
      shell.openExternal(url);
    }
    return { action: "deny" };
  });

  mainWindow.on("closed", () => {
    console.log("Window closed");
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  console.log("🚀 Electron app is ready\n");
  createWindow();
});

app.on("window-all-closed", () => {
  console.log("All windows closed");
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  console.log("App activated");
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
