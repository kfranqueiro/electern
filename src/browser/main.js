"use strict";
require("./preload-handlers");
const pathUtil = require("path");

const { BrowserWindow, Menu, app, ipcMain, session, shell } = require("electron");

const menuTemplate = require("./menu");

const isPrimaryInstance = app.requestSingleInstanceLock();
if (!isPrimaryInstance) app.quit();

if (process.argv.indexOf("--portable") > -1) {
  app.setPath("userData", pathUtil.join(pathUtil.dirname(app.getPath("exe")), "userData"));
}

app.on("window-all-closed", () => {
  app.quit();
});

app.whenReady().then(() => {
  session.defaultSession.webRequest.onHeadersReceived((details, cb) => {
    cb({
      responseHeaders: {
        ...details.responseHeaders,
        "Content-Security-Policy": "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      },
    });
  });

  // Load userConfig after ready event fires with userData folder set,
  // so the folder exists and userConfig loads the right file
  const userConfig = require("../common/userConfig");

  const size = userConfig.uiOptions.size;
  const mainWindow = new BrowserWindow({
    center: true,
    title: "Electern",
    minWidth: 750,
    minHeight: 500,
    width: size[0],
    height: size[1],
    webPreferences: {
      preload: pathUtil.join(__dirname, "preload.js"),
    },
  });

  mainWindow.webContents.on("will-navigate", function (event, url) {
    // Open links in user's default browser
    event.preventDefault();
    shell.openExternal(url);
  });

  app.on("second-instance", () => {
    if (mainWindow.isMinimized) mainWindow.restore();
    mainWindow.focus();
  });

  // Disables or enables file and feed menus (except Quit), for when modal dialogs are displayed
  ipcMain.on("menu-enable", (_, enabled) => {
    const enable = (item) => (item.enabled = enabled);
    menu.items[0].submenu.items.slice(0, -1).forEach(enable);
    menu.items[2].submenu.items.forEach(enable);
  });

  ipcMain.handle("get-window-size", () => mainWindow.getSize());

  const menu = Menu.buildFromTemplate(menuTemplate);
  Menu.setApplicationMenu(menu);
  mainWindow.loadURL("file://" + pathUtil.resolve(__dirname, "..", "index.html"));
});
