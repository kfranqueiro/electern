define([
	'dstore/Trackable',
	'./FsMemory',
	'common/userConfig'
], function (Trackable, FsMemory, userConfig) {
	var fs = require('fs');

	var ArticleStore = FsMemory.createSubclass([ Trackable ], {
		addSync(item) {
			var existingItem = this.getSync(item.id);
			if (existingItem) {
				// Bail out rather than throwing an error
				return existingItem;
			}

			return this.inherited(arguments);
		},

		removeSync(id) {
			var item = this.getSync(id);
			if (item && item.archive) {
				require('fs').unlinkSync(item.archive);
			}
			return this.inherited(arguments);
		},

		prune(feedId) {
			'use strict';
			const data = this.filter(function (article) {
				return article.feedId === feedId && !article.isPinned;
			}).sort([ { property: 'date' } ]).fetchSync();
			const numToRemove = data.length - userConfig.getOptions(feedId).maxTotal;

			for (let i = 0; i < numToRemove; i++) {
				this.removeSync(data[i].id);
			}
		},

		setData(data) {
			data.forEach(function (article) {
				if (article.pdf && !fs.existsSync(article.pdf)) {
					delete article.pdf;
				}
			});

			this.inherited(arguments);
		}
	});

	return new ArticleStore();
});
