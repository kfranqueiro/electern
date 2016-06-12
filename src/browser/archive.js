'use strict';
const fs = require('fs');
const join = require('path').join;
const electron = require('electron');
const BrowserWindow = electron.BrowserWindow;
const fileUrl = require('file-url');

exports.download = function (url, filename) {
	let archiveWindow = new BrowserWindow({
		show: false,
		webPreferences: {
			javascript: false,
			nodeIntegration: false
		}
	});
	let webContents = archiveWindow.webContents;

	const promise = new Promise(function (resolve, reject) {
		webContents.once('did-finish-load', function () {
			const saveDir = join(electron.app.getPath('userData'), 'downloadedPages');
			if (!fs.existsSync(saveDir)) {
				fs.mkdirSync(saveDir);
			}

			const absoluteFilename = join(saveDir, filename);
			webContents.savePage(absoluteFilename, 'MHTML', function (err) {
				if (err) {
					return reject(err);
				}
				resolve(absoluteFilename);
			});
		});
	});

	function closeWindow() {
		archiveWindow.destroy();
		archiveWindow = webContents = null;
	}

	promise.then(closeWindow, closeWindow);

	archiveWindow.loadURL(url);
	return promise;
};

exports.view = function (filename) {
	const bounds = BrowserWindow.getFocusedWindow().getBounds();

	let archiveWindow = new BrowserWindow({
		height: bounds.height,
		width: bounds.width,
		webPreferences: {
			javascript: false,
			nodeIntegration: false
		}
	});
	archiveWindow.setMenu(null);
	archiveWindow.loadURL(fileUrl(filename));

	archiveWindow.on('closed', function () {
		archiveWindow = null;
	});

	archiveWindow.webContents.on('will-navigate', function (event, url) {
		// Open links from downloaded pages in user's default browser
		event.preventDefault();
		electron.shell.openExternal(url);
	});
};
