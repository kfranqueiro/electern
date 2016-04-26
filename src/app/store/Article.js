define([
	'dstore/Trackable',
	'./FsMemory',
	'../userConfig'
], function (Trackable, FsMemory, userConfig) {
	return FsMemory.createSubclass([ Trackable ], {
		addSync(item) {
			var existingItem = this.getSync(item.id);
			if (existingItem) {
				// Bail out rather than throwing an error
				return existingItem;
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
		}
	});
});
