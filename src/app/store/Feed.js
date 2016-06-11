define([
	'dstore/Trackable',
	'dstore/Tree',
	'./FsMemory',
	'../userConfig',
	'dojo/i18n!../nls/main'
], function (Trackable, Tree, FsMemory, userConfig, i18n) {
	/**
	 * Manages hierarchy of categories and feeds.
	 */
	return FsMemory.createSubclass([ Trackable, Tree ], {
		getChildren() {
			var subcollection = this.inherited(arguments);
			subcollection.queryLog = subcollection.queryLog.concat(this.queryLog.filter(function (args) {
				return !('parent' in args.arguments[0]);
			}));
			return subcollection;
		},

		/**
		 * Returns a promise resolving to an array containing all feed (not folder) items under a given parent.
		 * If no parent is passed, returns all feeds in the store.
		 */
		getFeeds(item) {
			var leaves = [];

			function processChild(child) {
				if (this.mayHaveChildren(child)) {
					this.getChildren(child).fetchSync().forEach(processChild, this);
				}
				else if (!child._system) {
					leaves.push(child);
				}
			}

			if (item) {
				processChild.call(this, item);
			}
			else {
				this.getRootCollection().forEach(processChild, this);
			}
			return leaves;
		},

		getOptions(item) {
			return userConfig.getOptions(item.id);
		},

		getUnread(item) {
			// Unread state is maintained when write operations occur; this assumes pre-existing consistency.
			return 'unread' in item ? item.unread : this.getFeeds(item).reduce((total, item) => {
				return total + item.unread;
			}, 0);
		},

		mayHaveChildren(item) {
			return !item.url && !item._system;
		},

		setData(data) {
			var items = [ {
				id: 'pinned',
				icon: 'thumb-tack',
				parent: null,
				title: i18n.pinned
			}, {
				id: 'unread',
				icon: 'bolt',
				parent: null,
				title: i18n.unread
			}, {
				id: 'search',
				icon: 'search',
				parent: null,
				title: i18n.searchResults
			} ];

			items.forEach(function (item, i) {
				Object.defineProperty(item, '_system', { value: items.length - i });
				data.push(item);
			});

			this.inherited(arguments);
		},

		toJSON() {
			return this.storage.fullData.filter(function (item) {
				return !item._system;
			});
		}
	});
});
