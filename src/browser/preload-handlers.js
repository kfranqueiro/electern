/** @fileoverview Event handlers for node APIs, etc. necessary for preload APIs */

const { app, ipcMain } = require("electron");
const { existsSync, promises, readFileSync, unlinkSync, writeFileSync } = require("fs");
const { resolve } = require("path");

const sanitizeHtml = require("sanitize-html");

const archive = require("./archive");

ipcMain.on("get-user-data-path", (event) => (event.returnValue = app.getPath("userData")));

ipcMain.on("sanitize-html", (event, html, allowImages) => {
  event.returnValue = sanitizeHtml(html, {
    exclusiveFilter: function (frame) {
      // Strip duplicated content caused by old TinyMCE bug
      // Reference: http://www.electrictoolbox.com/tinymce-mcepaste-divs-webkit-browsers/
      return frame.tag === "div" && frame.attribs["class"] === "mcePaste";
    },
    ...(allowImages && { allowedTags: sanitizeHtml.defaults.allowedTags.concat(["img"]) }),
  });
});

/**
 * Determines whehter a path should be permitted for fs operations across the renderer codebase.
 * @param {string} path
 */
const isAllowedPath = (path) =>
  // Allow mhtml access outside of userData path in case data was migrated to/from portable folder
  (path.startsWith(app.getPath("userData")) && path.endsWith(".json")) || path.endsWith(".mhtml");

ipcMain.on("exists-sync", (event, path) => {
  if (!isAllowedPath(path)) throw new Error(`Forbidden file read request: ${path}`);
  event.returnValue = existsSync(path);
});
ipcMain.on("unlink-sync", (event, path) => {
  if (!isAllowedPath(path)) throw new Error(`Forbidden file write request: ${path}`);
  event.returnValue = unlinkSync(path);
});
ipcMain.on("read-file-sync", (event, path, options) => {
  if (!isAllowedPath(path)) throw new Error(`Forbidden file read request: ${path}`);
  event.returnValue = readFileSync(path, options);
});
ipcMain.on("write-file-sync", (event, path, data) => {
  if (!isAllowedPath(path)) throw new Error(`Forbidden file write request: ${path}`);
  event.returnValue = writeFileSync(path, data);
});
ipcMain.on("resolve", (event, ...paths) => (event.returnValue = resolve(...paths)));

ipcMain.handle("read-file", (_, path, options) => {
  if (!isAllowedPath(path)) throw new Error(`Forbidden file read request: ${path}`);
  return promises.readFile(path, options);
});
ipcMain.handle("write-file", (_, path, data) => {
  if (!isAllowedPath(path)) throw new Error(`Forbidden file write request: ${path}`);
  return promises.writeFile(path, data);
});

ipcMain.handle("download-archive", (_, url, filename) => archive.download(url, filename));
ipcMain.on("view-archive", (_, filename) => archive.view(filename));
