define([
  "./_Base",
  "./_ParentFolderMixin",
  "dojo/i18n!../../nls/main",
  "dojo/text!./templates/Add.html",
  "dojo/text!./templates/partials/parent.html",
], function (_Base, _ParentFolderMixin, i18n, template, parentPartial) {
  return _Base.createSubclass([_ParentFolderMixin], {
    templateString: template,
    partials: {
      parentPartial: parentPartial,
    },

    _getValueAttr: function () {
      const obj = this.inherited(arguments);
      const selectedParent = Object.keys(this.folderGrid.selection)[0];
      obj.parent = typeof selectedParent === "undefined" ? null : +selectedParent;
      return obj;
    },

    reset: function (mode, parent) {
      this.headingNode.textContent = i18n[mode === "feed" ? "addFeed" : "addFolder"];
      this.labelNode.textContent = i18n[mode === "feed" ? "feedUrl" : "folderName"];
      this.inputNode.value = "";
      this.folderGrid.clearSelection();
      if (parent) {
        this.folderGrid.select(parent);
      }
    },
  });
});
