'use strict';
const pathUtil = require('path');

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

if (process.argv.indexOf('--portable') > -1) {
	app.setPath('userData', pathUtil.join(pathUtil.dirname(app.getPath('exe')), 'userData'));
}

app.on('window-all-closed', function () {
	app.quit();
});

app.on('ready', function () {
	// Load userConfig after ready event fires with userData folder set,
	// so the folder exists and userConfig loads the right file
	const userConfig = require('../common/userConfig');

	const size = userConfig.uiOptions.size;
	mainWindow = new BrowserWindow({
		center: true,
		title: 'Electern',
		minWidth: 750,
		minHeight: 500,
		width: size[0],
		height: size[1]
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
