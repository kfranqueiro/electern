'use strict';
define([
	'../store/article',
	'../store/feed',
	'../store/util',
	'../util'
], function (articleStore, feedStore, storeUtil, util) {
	const ipc = require('electron').ipcRenderer;
	const readFile = util.promisify(require('fs').readFile);

	function processOutline(outline, parent) {
		const length = outline.children.length;
		if (length) {
			const folder = storeUtil.addFolder(outline.getAttribute('text'), parent);
			for (let i = 0; i < length; i++) {
				processOutline(outline.children[i], folder.id);
			}
		}
		else {
			return storeUtil.addFeed(outline.getAttribute('xmlUrl'), parent);
		}
	}

	ipc.on('opml-import', function (event, filename) {
		readFile(filename, 'utf8').then(function (opml) {
			const doc = util.parseXml(opml);
			Array.from(doc.querySelectorAll('body > outline')).forEach(function (outline) {
				processOutline(outline, null);
			});
			articleStore.persist();
			feedStore.persist();
		});
	});
});
