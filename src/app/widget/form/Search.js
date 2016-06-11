define([
	'./_Base',
	'dojo/i18n!../../nls/main',
	'dojo/text!./templates/Search.html'
], function (_Base, i18n, template) {
	return _Base.createSubclass({
		templateString: template,

		validate: function () {
			var queryInput = this.domNode.elements.query;
			try {
				// jshint nonew: false
				new RegExp(queryInput.value);
			}
			catch (error) {
				return false;
			}
			return true;
		}
	});
});
