import { app, BrowserWindow, shell } from "electron";
import { join } from "path";
import { autoUpdater } from "electron-updater";

// 禁用硬件加速(可选)
// app.disableHardwareAcceleration();

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
      preload: join(__dirname, "./preload.js"),
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: true
    }
  });

  // 开发环境
  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
    mainWindow.webContents.openDevTools();
  } else {
    // 生产环境
    mainWindow.loadFile(join(__dirname, "../dist/index.html"));
  }

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
