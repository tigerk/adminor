import { app, BrowserWindow, shell } from "electron";
import { join, dirname } from "node:path";
import { autoUpdater } from "electron-updater";
import * as fs from "node:fs";
import { fileURLToPath } from "node:url";

// ES 模块中获取 __dirname 的替代方案
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 禁用硬件加速(可选)
// app.disableHardwareAcceleration();

function log(msg) {
  console.log(`[Electron Main] ${msg}`);
  try {
    const logfile = join(app.getPath("userData"), "main.log");
    fs.appendFileSync(logfile, msg + "\n");
  } catch (error) {
    console.error("Failed to write log:", error);
  }
}

log("App start...");

let mainWindow: BrowserWindow | null = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    show: false,
    autoHideMenuBar: true,
    webPreferences: {
      preload: join(__dirname, "preload.js"),
      nodeIntegration: false,
      contextIsolation: true,
      // 🔥 这两条是 Electron 39 + Vite DEV 模式必须加的
      allowRunningInsecureContent: true,
      webSecurity: false
    }
  });

  // 在开发模式下，vite-plugin-electron 会自动设置 VITE_DEV_SERVER_URL
  // 直接使用这个 URL，它包含了正确的端口（即使端口被占用而改变）
  let loadURL: string;
  if (process.env.VITE_DEV_SERVER_URL) {
    loadURL = process.env.VITE_DEV_SERVER_URL;
    log(`Dev mode - Using Vite server: ${loadURL}`);
  } else {
    // 生产模式：需要用户自行启动 web 服务
    loadURL = "http://localhost:7001";
    log(`Production mode - Loading: ${loadURL}`);
  }

  log(`VITE_DEV_SERVER_URL env: ${process.env.VITE_DEV_SERVER_URL}`);
  log(`Loading URL: ${loadURL}`);

  mainWindow.loadURL(loadURL);

  // 开发模式下打开 DevTools
  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.webContents.openDevTools();
  }

  // 监听加载错误
  mainWindow.webContents.on("did-fail-load", (event, errorCode, errorDescription, validatedURL) => {
    log(`Failed to load: ${validatedURL}`);
    log(`Error: ${errorCode} - ${errorDescription}`);
  });

  // 窗口准备好后显示
  mainWindow.once("ready-to-show", () => {
    mainWindow?.show();
  });

  // 拦截外部链接,用浏览器打开
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith("http")) {
      shell.openExternal(url);
    }
    return { action: "deny" };
  });

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

// 当 Electron 完成初始化时触发
app.whenReady().then(() => {
  createWindow();
  // 检查更新
  autoUpdater.checkForUpdatesAndNotify();

  app.on("activate", () => {
    // macOS 点击 dock 图标时重新创建窗口
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// 所有窗口关闭时退出应用 (macOS 除外)
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
