'use strict';
define([
	'dojo/_base/lang',
	'dojo/aspect',
	'dojo/on',
	'dojo/promise/all',
	'./grid/Article',
	'./grid/Feed',
	'./widget/ArticlePane',
	'./widget/form/Add',
	'./widget/form/Feed',
	'./widget/form/Folder',
	'./widget/form/Preferences',
	'./widget/form/modal',
	'./store/Article',
	'./store/Feed',
	'./retrieveFeed',
	'./userConfig',
	'./util'
], function (lang, aspect, on, all, ArticleGrid, FeedGrid, ArticlePane, AddForm, FeedForm, FolderForm,
		PreferencesForm, modal, ArticleStore, FeedStore, retrieveFeed, userConfig, util) {

	const fs = require('fs');
	const pathUtil = require('path');
	const ipc = require('electron').ipcRenderer;
	const userDataDir = require('electron').remote.app.getPath('userData');
	console.log(userDataDir);
	const readFile = util.promisify(fs.readFile);

	const feedStore = new FeedStore({
		filename: pathUtil.resolve(userDataDir, 'feeds.json')
	});

	const feedGrid = new FeedGrid({
		collection: feedStore.getRootCollection()
	}, 'feeds');

	const articleStore = new ArticleStore({
		filename: pathUtil.resolve(userDataDir, 'articles.json')
	});
	const articleGrid = new ArticleGrid({}, 'articles'); // Collection is assigned when a feed is selected

	const articlePane = new ArticlePane({}, 'article');

	let skipRecalculate = false;

	function recalculateUnread(feedId) {
		const feed = feedStore.getSync(feedId);
		feed.unread = articleStore.filter({ feedId: feedId }).fetchSync().reduce((total, article) => {
			return total + (article.isRead ? 0 : 1);
		}, 0);
		feedStore.putSync(feed);
	}

	function addArticles(articles, feed) {
		skipRecalculate = true;
		articles.forEach(function (article) {
			articleStore.addSync(lang.mixin(article, {
				feedId: feed.id,
				id: feed.id + ':' + article.id
			}));
		});
		skipRecalculate = false;
		recalculateUnread(feed.id);
	}

	function addFeed(url, parent) {
		return retrieveFeed(url).then(function (data) {
			const feed = feedStore.addSync(lang.mixin({
				parent: parent,
				unread: 0
			}, data.metadata));
			addArticles(data.articles, feed);
			return feed;
		});
	}

	function addFolder(name, parent) {
		return feedStore.addSync({ title: name, parent: parent });
	}

	function findNearestFolderId() {
		const selectedId = Object.keys(feedGrid.selection)[0];
		if (selectedId) {
			const item = feedStore.getSync(selectedId);
			return feedStore.mayHaveChildren(item) ? item.id : item.parent;
		}
		return null;
	}

	function removeFeed(id) {
		const articles = articleStore.filter({ feedId: id }).fetchSync();
		skipRecalculate = true;
		for (let i = articles.length; i--;) {
			articleStore.removeSync(articles[i].id);
		}
		skipRecalculate = false;
		recalculateUnread(id);
		feedStore.removeSync(id);
	}

	feedGrid.on('dgrid-select', function (event) {
		let collection;
		const item = feedGrid.row(event.rows[0]).data;
		if (item.id === 'pinned') {
			collection = articleStore.filter({ isPinned: true });
		}
		else if (item.id === 'unread') {
			collection = articleStore.filter(function (item) {
				return !item.isRead;
			});
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

	function incrementUnread(feedId, increment) {
		const feed = feedStore.getSync(feedId);
		feed.unread += increment;
		feedStore.putSync(feed);
	}

	articleGrid.on('dgrid-select,dgrid-deselect', function () {
		const keys = Object.keys(articleGrid.selection);
		if (keys.length === 1) {
			const article = articleStore.getSync(keys[0]);
			if (!article.isRead) {
				article.isRead = true;
				incrementUnread(article.feedId, -1);
			}
			// Selectively refresh rather than put, to avoid glitches due to select firing on mousedown.
			// This also effectively avoids items in the Unread filter immediately disappearing upon select.
			const cell = articleGrid.cell(article, 'isRead');
			cell.row.element.classList.remove('unread');
			articleGrid.refreshCell(cell);
			articlePane.set('article', lang.mixin({ feedTitle: feedStore.getSync(article.feedId).title }, article));
		}
	});

	// Use aspect rather than events to update unread counts in feedStore based on articleStore write operations,
	// since dstore doesn't provide enough info in events to be useful (no data in delete)

	aspect.after(articleStore, 'addSync', function (article) {
		// This handler will be hammered during mass article adding (for new feeds or periodic refreshes),
		// so avoid incurring N recalculations when we only need 1 (addArticles calls recalculateUnread).
		if (!skipRecalculate && !article.isRead) {
			incrementUnread(article.feedId, 1);
		}
		return article;
	});

	aspect.before(articleStore, 'removeSync', function (id) {
		const article = this.getSync(id);
		if (!skipRecalculate && article && !article.isRead) {
			incrementUnread(article.feedId, -1);
		}
	});

	aspect.before(articleStore, 'putSync', function (article) {
		// Unfortunately we need to do a full recount for the feed, since Memory doesn't protect/clone its objects
		// (IOW it's typically too late to get the old value by the time `put` is called).
		// Fortunately this path is far rarer than the path manually covered in the select handler above.
		if (!skipRecalculate) {
			recalculateUnread(article.feedId);
		}
	});

	// Form stuff

	const folderCollection = feedStore.getRootCollection().filter(function (item) {
		return feedStore.mayHaveChildren(item);
	});
	const addForm = new AddForm({ folderCollection: folderCollection });
	const feedForm = new FeedForm({ folderCollection: folderCollection });
	const folderForm = new FolderForm(); // folderCollection is set when displayed
	const preferencesForm = new PreferencesForm();
	let shouldDelete;

	function setDelete() {
		shouldDelete = true;
	}
	feedForm.on('delete', setDelete);
	folderForm.on('delete', setDelete);

	function showAddFeed() {
		modal.show(addForm).then(function (value) {
			return addFeed(value.input, value.parent);
		}).then(function (feed) {
			feedGrid.focus(feedGrid.row(feed).element);
			return all([
				articleStore.persist(),
				feedStore.persist()
			]);
		});
		// Reset after showing to allow dgrid selection to find element in DOM and decorate properly
		addForm.reset('feed', findNearestFolderId());
	}

	function showAddFolder() {
		modal.show(addForm).then(function (value) {
			feedGrid.focus(feedGrid.row(addFolder(value.input, value.parent)).element);
			return feedStore.persist();
		});
		addForm.reset('folder', findNearestFolderId());
	}

	function showEditFeed(item) {
		let value = { feed: item };
		let form;
		shouldDelete = false;

		if (feedStore.mayHaveChildren(item)) {
			form = folderForm;
			form.set('folderCollection', folderCollection.filter(function (i) {
				return i !== item;
			}));
		}
		else {
			form = feedForm;
			value.config = userConfig.feedOptions[item.id];
		}

		modal.show(form).then(function (value) {
			feedStore.put(lang.mixin(item, value.feed));
			if (value.config) {
				userConfig.setOptions(item.id, value.config);
				userConfig.save();
			}
		}, function () {
			if (shouldDelete) {
				if (feedStore.mayHaveChildren(item)) {
					const parents = {};
					feedStore.getFeeds(item).forEach(function (feed) {
						parents[feed.parent] = true;
						removeFeed(feed.id);
					});

					for (let id in parents) {
						feedStore.removeSync(id);
					}

					feedStore.removeSync(item.id);
				}
				else {
					removeFeed(item.id);
				}
			}
		}).always(function () {
			feedGrid.focus();
		});

		form.set('value', value);
	}

	feedGrid.on('.fa-pencil:click', function (event) {
		showEditFeed(feedGrid.row(event).data);
	});

	// IPC messages

	function processOutline(outline, parent) {
		const length = outline.children.length;
		if (length) {
			const folder = addFolder(outline.getAttribute('text'), parent);
			for (let i = 0; i < length; i++) {
				processOutline(outline.children[i], folder.id);
			}
		}
		else {
			return addFeed(outline.getAttribute('xmlUrl'), parent);
		}
	}

	ipc.on('opml-import', function (event, filename) {
		readFile(filename, 'utf8').then(function (opml) {
			const doc = util.parseXml(opml);
			Array.from(doc.querySelectorAll('body > outline')).forEach(function (outline) {
				processOutline(outline, null);
			});
			articleStore.persist(),
			feedStore.persist()
		});
	});

	ipc.on('new-feed', showAddFeed);
	ipc.on('new-folder', showAddFolder);

	ipc.on('feed-edit', function () {
		var selected = Object.keys(feedGrid.selection)[0];
		if (selected && !feedStore.getSync(selected)._system) {
			showEditFeed(feedGrid.row(selected).data);
		}
	});

	ipc.on('feed-refresh-all', function () {
		feedStore.getFeeds().forEach(function (feed) {
			feed.downloadedDate = 0;
		});
		tick();
	});

	ipc.on('preferences', function () {
		preferencesForm.set('value', {
			config: userConfig.defaultOptions
		});
		modal.show(preferencesForm).then(function (value) {
			userConfig.defaultOptions = value.config;
			userConfig.save();
		});
	});

	// Periodic refresh

	const TICK_INTERVAL = 150000;

	function tick() {
		const promises = [];
		feedStore.getFeeds().forEach(function (feed) {
			if (feed.downloadedDate < new Date() - feedStore.getOptions(feed).updateInterval * 60000) {
				promises.push(retrieveFeed(feed.url).then(function (data) {
					feed.downloadedDate = data.metadata.downloadedDate;
					feedStore.putSync(feed);
					addArticles(data.articles, feed);
				}).then(function () {
					articleStore.prune(feed.id);
				}));
			}
		});

		all(promises).always(function () {
			articleStore.persist();
			feedStore.persist();
		});

		setTimeout(tick, TICK_INTERVAL);
	}

	tick();

	window.onunload = function () {
		articleStore.persistSync();
		feedStore.persistSync();
	};
});
