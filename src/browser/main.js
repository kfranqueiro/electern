'use strict';
const electron = require('electron');
const app = electron.app;
const BrowserWindow = electron.BrowserWindow;
const Menu = electron.Menu;
const ipc = electron.ipcMain;

const archive = require('./archive');
const menuTemplate = require('./menu');

let menu;
let mainWindow;

const shouldQuit = app.makeSingleInstance(function () {
	if (mainWindow) {
		if (mainWindow.isMinimized) {
			mainWindow.restore();
		}
		mainWindow.focus();
	}
});

if (shouldQuit) {
	app.quit();
}

app.on('window-all-closed', function () {
	app.quit();
});

app.on('ready', function () {
	mainWindow = new BrowserWindow({
		center: true,
		title: 'Electern',
		minWidth: 600,
		minHeight: 300,
		width: 1000,
		height: 600
	});

	menu = Menu.buildFromTemplate(menuTemplate);
	Menu.setApplicationMenu(menu);
	mainWindow.loadURL('file://' + require('path').resolve(__dirname, '..', 'index.html'));

	mainWindow.on('closed', function () {
		mainWindow = null;
	});
});

// Disables or enables file and feed menus (except Quit), for when modal dialogs are displayed
ipc.on('menu-enable', function (event, enabled) {
	function enable(item) {
		item.enabled = enabled;
	}

	menu.items[0].submenu.items.slice(0, -1).forEach(enable);
	menu.items[2].submenu.items.forEach(enable);
});

ipc.on('download-archive', function (event, url, filename) {
	archive.download(url, filename).then(function (absoluteFilename) {
		mainWindow.webContents.send('archive-downloaded', url, absoluteFilename);
	}, function (error) {
		mainWindow.webContents.send('archive-failed', url, error);
	});
});

ipc.on('view-archive', function (event, filename) {
	archive.view(filename);
});
