'use strict';
define([
	'dojo/_base/lang',
	'dojo/aspect',
	'./article',
	'./feed',
	'../retrieveFeed'
], function (lang, aspect, articleStore, feedStore, retrieveFeed) {
	let skipRecalculate = false;

	function recalculateUnread(feedId) {
		const feed = feedStore.getSync(feedId);
		feed.unread = articleStore.filter({ feedId: feedId }).fetchSync().reduce((total, article) => {
			return total + (article.isRead ? 0 : 1);
		}, 0);
		feedStore.putSync(feed);
	}

	var util = {
		incrementUnread(feedId, increment) {
			const feed = feedStore.getSync(feedId);
			feed.unread += increment;
			feedStore.putSync(feed);
		},

		addArticles(articles, feed) {
			skipRecalculate = true;
			articles.forEach(function (article) {
				articleStore.addSync(lang.mixin(article, {
					feedId: feed.id,
					id: feed.id + ':' + article.id
				}));
			});
			skipRecalculate = false;
			recalculateUnread(feed.id);
		},

		addFeed(url, parent) {
			return retrieveFeed(url).then(function (data) {
				const feed = feedStore.addSync(lang.mixin({
					parent: parent,
					unread: 0
				}, data.metadata));
				util.addArticles(data.articles, feed);
				return feed;
			});
		},

		addFolder(name, parent) {
			return feedStore.addSync({ title: name, parent: parent });
		},

		removeFeed(id) {
			const articles = articleStore.filter({ feedId: id }).fetchSync();
			skipRecalculate = true;
			for (let i = articles.length; i--;) {
				articleStore.removeSync(articles[i].id);
			}
			skipRecalculate = false;
			recalculateUnread(id);
			feedStore.removeSync(id);
		}
	};

	// Use aspect rather than events to update unread counts in feedStore based on articleStore write operations,
	// since dstore doesn't provide enough info in events to be useful (no data in delete)

	aspect.after(articleStore, 'addSync', function (article) {
		// This handler will be hammered during mass article adding (for new feeds or periodic refreshes),
		// so avoid incurring N recalculations when we only need 1 (addArticles calls recalculateUnread).
		if (!skipRecalculate && !article.isRead) {
			util.incrementUnread(article.feedId, 1);
		}
		return article;
	});

	aspect.before(articleStore, 'removeSync', function (id) {
		const article = this.getSync(id);
		if (!skipRecalculate && article && !article.isRead) {
			util.incrementUnread(article.feedId, -1);
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

	return util;
});
