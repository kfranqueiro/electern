'use strict';
define([
	'dojo/on',
	'dojo/topic',
	'dgrid/util/misc',
	'./dialogs',
	'./grid/article',
	'./grid/feed',
	'./widget/articlePane',
	'./store/article',
	'./store/feed',
	'./store/util',
	'./refresh',
	'./resize',
	'./opml/import'
], function (on, topic, miscUtil, dialogs, articleGrid, feedGrid, articlePane, articleStore, feedStore,
		storeUtil, refresh) {

	const pathUtil = require('path');
	const userDataDir = require('electron').remote.app.getPath('userData');

	feedStore.setFilename(pathUtil.resolve(userDataDir, 'feeds.json'));
	articleStore.setFilename(pathUtil.resolve(userDataDir, 'articles.json'));

	// Wait until after setting filenames to run first refresh cycle
	refresh.tick();

	feedGrid.set('collection', feedStore.getRootCollection());
	// Collection is assigned to articleGrid when a feed is selected

	let searchRx;
	topic.subscribe('/search', function (rx) {
		searchRx = rx;
	});

	feedGrid.on('.fa-pencil:click', function (event) {
		dialogs.showEditFeed(feedGrid.row(event).data);
	});

	feedGrid.on('dgrid-select', function (event) {
		let collection;
		const item = feedGrid.row(event.rows[0]).data;
		if (item.id === 'pinned') {
			collection = articleStore.filter({ isPinned: true });
		}
		else if (item.id === 'unread') {
			collection = articleStore.filter(function (article) {
				return !article.isRead;
			});
		}
		else if (item.id === 'search') {
			collection = searchRx ? articleStore.filter(function (article) {
				return searchRx.test(article.title) || searchRx.test(article.content);
			}) : null;
		}
		else if (!feedStore.mayHaveChildren(item)) {
			collection = articleStore.filter({ feedId: item.id });
		}
		else {
			const feedMap = {};
			feedStore.getFeeds(item).forEach(function (feed) {
				feedMap[feed.id] = true;
			});
			collection = articleStore.filter(function (article) {
				return feedMap[article.feedId];
			});
		}
		articleGrid.set('collection', collection);
	});

	feedGrid.on('dgrid-deselect', function () {
		articleGrid.set('collection', null);
		articlePane.set('article', null);
	});

	articleGrid.on('dgrid-select,dgrid-deselect', function () {
		const keys = Object.keys(articleGrid.selection);
		if (keys.length === 1) {
			const article = articleStore.getSync(keys[0]);
			if (!article.isRead) {
				article.isRead = true;
				storeUtil.incrementUnread(article.feedId, -1);
			}
			// Selectively refresh rather than put, to avoid glitches due to select firing on mousedown.
			// This also effectively avoids items in the Unread filter immediately disappearing upon select.
			const cell = articleGrid.cell(article, 'isRead');
			cell.row.element.classList.remove('unread');
			articleGrid.refreshCell(cell);
			articlePane.set('article', article);
		}
	});

	window.onunload = function () {
		articleStore.persistSync();
		feedStore.persistSync();
	};
});
