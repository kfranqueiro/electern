// From http://dgrid.io/tutorials/1.0/single_query/
define([
	'dojo/_base/declare',
	'dgrid/_StoreMixin'
], function (declare, _StoreMixin) {
	return declare(_StoreMixin, {
		refresh: function () {
			// First defer to List#refresh to clear the grid's
			// previous content
			this.inherited(arguments);

			if (!this._renderedCollection) {
				return;
			}

			return this._trackError(() => {
				return this.renderQueryResults(this._renderedCollection.fetch());
			});
		},

		renderArray: function () {
			var rows = this.inherited(arguments);

			// Clear _lastCollection which is ordinarily only used for store-less grids
			this._lastCollection = null;

			return rows;
		}
	});
});
