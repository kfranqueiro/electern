define([
	'dojo/promise/all',
	'./store/article',
	'./store/feed',
	'./store/util',
	'./retrieveFeed'
], function (all, articleStore, feedStore, storeUtil, retrieveFeed) {
	const TICK_INTERVAL = 150000;

	function refresh(feed) {
		return retrieveFeed(feed.url).then(function (data) {
			feed.downloadedDate = data.metadata.downloadedDate;
			feedStore.putSync(feed);
			storeUtil.addArticles(data.articles, feed);
		}).then(function () {
			articleStore.prune(feed.id);
		});
	}

	function tick() {
		const promises = [];
		feedStore.getFeeds().forEach(function (feed) {
			if (feed.downloadedDate < new Date() - feedStore.getOptions(feed).updateInterval * 60000) {
				promises.push(refresh(feed));
			}
		});

		all(promises).always(function () {
			articleStore.persist();
			feedStore.persist();
		});
	}

	refresh.tick = tick;
	setInterval(tick, TICK_INTERVAL);

	require('electron').ipcRenderer.on('feed-refresh-all', function () {
		feedStore.getFeeds().forEach(function (feed) {
			feed.downloadedDate = 0;
		});
		tick();
	});

	return refresh;
});
