'use strict';
const electron = require('electron');
const app = electron.app;
const BrowserWindow = electron.BrowserWindow;
const dialog = electron.dialog;

const menu = module.exports = [];
const isDarwin = process.platform === 'darwin';

function send() {
	const webContents = BrowserWindow.getFocusedWindow().webContents;
	webContents.send.apply(webContents, arguments);
}

menu.push(
	{
		label: '&File',
		submenu: [
			{
				label: '&New Feed',
				accelerator: 'CmdOrCtrl+N',
				click() {
					send('new-feed');
				}
			},
			{
				label: 'New &Folder',
				accelerator: 'CmdOrCtrl+Shift+N',
				click() {
					send('new-folder');
				}
			},
			{
				label: '&Import from OPML...',
				click() {
					const window = BrowserWindow.getFocusedWindow();
					dialog.showOpenDialog(window, {
						filters: [ { name: 'OPML files', extensions: [ 'opml' ] } ],
						properties: [ 'openFile' ]
					}, function (filename) {
						if (filename && filename[0]) {
							window.webContents.send('opml-import', filename[0]);
						}
					});
				}
			},
			{
				label: '&Preferences',
				accelerator: 'CmdOrCtrl+,',
				click() {
					send('preferences');
				}
			},
			{
				label: '&Quit',
				accelerator: 'CmdOrCtrl+Q',
				click() {
					app.quit();
				}
			}
		]
	},
	{
		label: '&Edit',
		submenu: [
			{
				label: 'Cut',
				accelerator: 'CmdOrCtrl+X',
				role: 'cut'
			},
			{
				label: '&Copy',
				accelerator: 'CmdOrCtrl+C',
				role: 'copy'
			},
			{
				label: '&Paste',
				accelerator: 'CmdOrCtrl+V',
				role: 'paste'
			}
		]
	},
	{
		label: 'F&eed',
		submenu: [
			{
				label: '&Edit Feed/Folder',
				accelerator: 'CmdOrCtrl+E',
				click() {
					send('feed-edit');
				}
			},
			{
				label: 'Mark Feed/Folder as &Read',
				accelerator: 'CmdOrCtrl+R',
				click() {
					send('feed-mark-all-as-read');
				}
			},
			{
				label: 'Refresh &All Now',
				click() {
					send('feed-refresh-all');
				}
			}
		]
	}
);

if (process.env.ELECTRON_APP_DEBUG) {
	menu.push(
		{
			label: '&Debug',
			submenu: [
				{
					label: '&Reload',
					accelerator: 'F5',
					click() {
						BrowserWindow.getFocusedWindow().webContents.reloadIgnoringCache();
					}
				},
				{
					label: 'Toggle &Developer Tools',
					accelerator: isDarwin ? 'Alt+Cmd+I' : 'Ctrl+Shift+I',
					click() {
						BrowserWindow.getFocusedWindow().toggleDevTools();
					}
				}
			]
		}
	);
}
