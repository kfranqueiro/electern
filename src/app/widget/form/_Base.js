define([
  "dojo/_base/declare",
  "dojo/on",
  "dojo/string",
  "dijit/_WidgetBase",
  "dijit/_TemplatedMixin",
  "../../util",
  "dojo/i18n!../../nls/main",
], function (declare, on, string, _WidgetBase, _TemplatedMixin, util, i18n) {
  /**
   * A form widget managing a pure HTML form, rather than input widgets.
   */
  return declare([_WidgetBase, _TemplatedMixin], {
    baseClass: "Form",
    i18n: i18n,

    /** Object containing partial templates to be inserted before _TemplatedMixin#buildRendering is called */
    partials: null,

    value: null,

    buildRendering() {
      if (this.partials) {
        this.templateString = string.substitute(
          this.templateString,
          this.partials,
          function (value, key) {
            // Allow substitutions to fail, to be processed during normal template rendering
            return typeof value === "undefined" ? "${" + key + "}" : value;
          }
        );
      }

      this.inherited(arguments);

      this.own(
        on(this.domNode, "submit", function (event) {
          event.preventDefault();
        })
      );
    },

    _getValueAttr() {
      const elements = this.domNode.elements;
      const values = {};

      // Implement serialization rather than using dojo/dom-form for the following special features:
      // * Checkboxes -> booleans, not strings (only ever expect one checkbox per name)
      // * Include checkbox fields even if unchecked (set to false)
      // * Coerce numeric values to numbers
      for (let i = 0; i < elements.length; i++) {
        const element = elements[i];
        if (!element.name || element.disabled) {
          continue;
        }
        let value = element[element.type === "checkbox" ? "checked" : "value"];
        if (typeof value === "string" && !isNaN(value)) {
          value = +value;
        }
        values[element.name] = value;
      }
      return util.unflatten(values);
    },

    _setValueAttr(value) {
      this.domNode.reset();
      const flattenedValue = util.flatten(value);
      for (const key in flattenedValue) {
        const input = this.domNode.elements[key];
        if (input) this._setInputValue(input, flattenedValue[key]);
      }
    },

    _setInputValue(input, value) {
      // This only has enough code to support cases known to be used in the UI
      if (input.type === "checkbox") {
        input.checked = !!value;
      } else {
        input.value = value;
      }
    },

    _onCancelClick() {
      this.emit("cancel", {
        bubbles: false,
        cancelable: false,
      });
    },
  });
});
