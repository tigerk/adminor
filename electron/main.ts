import { app, BrowserWindow, shell } from "electron";
import { join, dirname } from "node:path";
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

  // 🔥 修改：更明确的 URL 判断逻辑
  let loadURL: string;

  if (process.env.VITE_DEV_SERVER_URL) {
    loadURL = process.env.VITE_DEV_SERVER_URL;
    console.log("✅ Using VITE_DEV_SERVER_URL:", loadURL);
  } else if (process.env.NODE_ENV === "development") {
    const port = process.env.VITE_PORT || "7001";
    loadURL = `http://localhost:${port}`;
    console.log("⚠️ VITE_DEV_SERVER_URL not found, using fallback:", loadURL);
  } else {
    loadURL = `file://${join(__dirname, "../dist/index.html")}`;
    console.log("📦 Production mode, loading file:", loadURL);
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
