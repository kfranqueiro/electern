define([
	'dojo/_base/declare',
	'dojo/dom-construct',
	'dgrid/extensions/SingleQuery',
	'dgrid/Grid',
	'dgrid/Keyboard',
	'dgrid/Selection',
	'dgrid/Tree'
], function (declare, domConstruct, SingleQuery, Grid, Keyboard, Selection, Tree) {
	function renderCell(item, value, cell) {
		if (this.grid.showUnread) {
			var unread = this.grid.collection.getUnread(item);
			cell.classList.toggle('unread', !!unread);
		}

		if (!item._system) {
			domConstruct.create('span', {
				className: 'fa fa-pencil'
			}, cell);
		}

		cell.appendChild(document.createTextNode(value + (unread ? ' (' + unread + ')' : '')));
	}

	return declare([ Grid, SingleQuery, Keyboard, Selection, Tree ], {
		enableTreeTransitions: false,
		maintainOddEven: false,
		selectionMode: 'single',
		showHeader: false,
		tabableHeader: false,
		treeIndentWidth: 15,

		/** Whether to display unread counts */
		showUnread: true,

		postMixInProperties() {
			this.inherited(arguments);
			this.columns = {
				title: {
					renderCell: this.showUnread ? renderCell : null,
					renderExpando(level, hasChildren, expanded, item) {
						var node = this.grid._defaultRenderExpando.apply(this, arguments);
						if (hasChildren) {
							node.className = 'dgrid-expando-icon fa fa-folder';
						}
						else {
							node.className = 'fa fa-' + (item.icon || 'rss');
						}
						return node;
					}
				}
			};
			this.sort = [ { property: '_system', descending: true }, { property: 'title' } ];

			if (this.showUnread) {
				// Add collection handler here, since the app only sets it once in the constructor args
				this.collection.on('update', (event) => {
					var item = event.target;
					if (item.url) {
						// Unread count may have been updated; update unread count displayed on ancestors.
						// Re-call refreshCell rather than calling put, which would make the grid
						// re-render the entire row _and_ its children.
						// (refreshCell loses level information, but that's worked around in renderExpando above.)
						while (item.parent != null) {
							item = this.collection.getSync(item.parent);
							this.refreshCell(this.cell(item, 'title'));
						}
					}
				});
			}
		},

		postCreate() {
			this.inherited(arguments);

			// Allow clearing selection by clicking in empty space in content node,
			// mainly to make it easier to create top-level feeds/folders (by selecting nothing)
			this.on('.dgrid-content:click', (event) => {
				if (event.target === this.contentNode) {
					this.clearSelection();
				}
			});
		},

		highlightRow() {}
	});
});
