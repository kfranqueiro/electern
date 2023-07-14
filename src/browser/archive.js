"use strict";
const { existsSync, mkdirSync } = require("fs");
const { join } = require("path");
const { app, BrowserWindow, shell } = require("electron");
const fileUrl = require("file-url");

exports.download = function (url, filename) {
  let archiveWindow = new BrowserWindow({
    show: false,
    webPreferences: {
      javascript: false,
    },
  });

  return archiveWindow
    .loadURL(url)
    .then(() => {
      const saveDir = join(app.getPath("userData"), "downloadedPages");
      if (!existsSync(saveDir)) mkdirSync(saveDir);

      const absoluteFilename = join(saveDir, filename);
      return archiveWindow.webContents
        .savePage(absoluteFilename, "MHTML")
        .then(() => absoluteFilename);
    })
    .finally(() => {
      archiveWindow.destroy();
      archiveWindow = null;
    });
};

exports.view = function (filename) {
  const [width, height] = BrowserWindow.getFocusedWindow().getSize();

  let archiveWindow = new BrowserWindow({
    width,
    height,
    webPreferences: {
      javascript: false,
    },
  });
  archiveWindow.setMenu(null);
  archiveWindow.loadURL(fileUrl(filename));

  archiveWindow.on("closed", function () {
    archiveWindow = null;
  });

  archiveWindow.webContents.on("will-navigate", function (event, url) {
    // Open links from downloaded pages in user's default browser
    event.preventDefault();
    shell.openExternal(url);
  });
};
