define([
	'./_Base',
	'dojo/text!./templates/_Confirm.html'
], function (_Base, template) {
	return _Base.createSubclass({
		templateString: template,

		_setMessageAttr: function (message) {
			this._set('message', message);
			this.messageNode.textContent = message;
		},

		_setTitleAttr: function (title) {
			this._set('title', title);
			this.titleNode.textContent = title;
		}
	});
});
