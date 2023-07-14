"use strict";
const { app, dialog } = require("electron");

const menu = (module.exports = []);
const isDarwin = process.platform === "darwin";

menu.push(
  {
    label: "&File",
    submenu: [
      {
        label: "&New Feed",
        accelerator: "CmdOrCtrl+N",
        click(_, window) {
          window.webContents.send("new-feed");
        },
      },
      {
        label: "New &Folder",
        accelerator: "CmdOrCtrl+Shift+N",
        click(_, window) {
          window.webContents.send("new-folder");
        },
      },
      {
        label: "&Import from OPML...",
        click(_, window) {
          dialog.showOpenDialog(
            window,
            {
              filters: [{ name: "OPML files", extensions: ["opml"] }],
              properties: ["openFile"],
            },
            function (filename) {
              if (filename && filename[0]) {
                window.webContents.send("opml-import", filename[0]);
              }
            }
          );
        },
      },
      {
        label: "&Preferences",
        accelerator: "CmdOrCtrl+,",
        click(_, window) {
          window.webContents.send("preferences");
        },
      },
      {
        label: "&Quit",
        accelerator: "CmdOrCtrl+Q",
        click() {
          app.quit();
        },
      },
    ],
  },
  {
    label: "&Edit",
    submenu: [
      {
        label: "Cut",
        accelerator: "CmdOrCtrl+X",
        role: "cut",
      },
      {
        label: "&Copy",
        accelerator: "CmdOrCtrl+C",
        role: "copy",
      },
      {
        label: "&Paste",
        accelerator: "CmdOrCtrl+V",
        role: "paste",
      },
    ],
  },
  {
    label: "Fee&d",
    submenu: [
      {
        label: "Find Articles...",
        accelerator: "CmdOrCtrl+F",
        click(_, window) {
          window.webContents.send("article-search");
        },
      },
      {
        label: "Mark Feed/Folder as &Read",
        accelerator: "CmdOrCtrl+R",
        click(_, window) {
          window.webContents.send("feed-mark-all-as-read");
        },
      },
      {
        label: "&Edit Feed/Folder...",
        accelerator: "CmdOrCtrl+E",
        click(_, window) {
          window.webContents.send("feed-edit");
        },
      },
      {
        label: "Refresh &All Now",
        click(_, window) {
          window.webContents.send("feed-refresh-all");
        },
      },
    ],
  }
);

if (process.env.ELECTERN_DEV) {
  menu.push({
    label: "De&bug",
    submenu: [
      {
        label: "&Reload",
        accelerator: isDarwin ? "CmdOrCtrl+Shift+R" : "F5",
        click(_, window) {
          window.webContents.reloadIgnoringCache();
        },
      },
      {
        label: "Toggle &Developer Tools",
        accelerator: isDarwin ? "Alt+Cmd+I" : "Ctrl+Shift+I",
        click(_, window) {
          window.toggleDevTools();
        },
      },
    ],
  });
}
