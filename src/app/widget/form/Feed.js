define([
	'dojo/dom-construct',
	'dojo/on',
	'./_FeedBase',
	'common/userConfig',
	'dojo/i18n!../../nls/main',
	'dojo/text!./templates/Feed.html'
], function (domConstruct, on, _FeedBase, userConfig, i18n, template) {
	var slice = Array.prototype.slice;

	return _FeedBase.createSubclass({
		templateString: template,
		deletePrompt: i18n.deleteFeedPrompt,

		buildRendering() {
			this.inherited(arguments);
			this._overrideCheckboxes = [];

			// Each input that is overridable per-feed will have a checkbox to enable/disable the override
			var nodes = slice.call(this.overridesNode.getElementsByClassName(this.baseClass + '-row'));
			nodes.forEach((node) => {
				this._overrideCheckboxes.push(domConstruct.create('input', {
					type: 'checkbox'
				}, node, 'first'));
			});

			this.own(on(this.overridesNode, 'change', function (event) {
				var target = event.target;
				if (!target.name) {
					target.parentNode.lastElementChild.disabled = !target.checked;
				}
			}));
		},

		_getValueAttr() {
			var value = this.inherited(arguments);
			// If none of the overrides are enabled, ensure that feed config is cleared
			value.config = value.config || {};
			return value;
		},

		_setValueAttr(value) {
			var defaultOptions = userConfig.getOptions();
			this.inherited(arguments);
			this._overrideCheckboxes.forEach(function (checkbox) {
				var input = checkbox.parentNode.lastElementChild;
				if (input.name in value) {
					checkbox.checked = true;
					input.disabled = false;
				}
				else {
					var key = input.name.slice(input.name.indexOf('.') + 1);
					checkbox.checked = false;
					input.disabled = true;
					input[input.type === 'checkbox' ? 'checked' : 'value'] = defaultOptions[key];
				}
			}, this);
		}
	});
});
