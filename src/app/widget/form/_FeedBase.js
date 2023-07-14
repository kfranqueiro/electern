define([
  "./_Base",
  "./_ParentFolderMixin",
  "./modal",
  "dojo/i18n!../../nls/main",
  "dojo/text!./templates/partials/actions.html",
  "dojo/text!./templates/partials/overrides.html",
  "dojo/text!./templates/partials/parent.html",
], function (
  _Base,
  _ParentFolderMixin,
  modal,
  i18n,
  actionsPartial,
  overridesPartial,
  parentPartial
) {
  return _Base.createSubclass([_ParentFolderMixin], {
    deletePrompt: "",
    folderCollection: null,

    partials: {
      actionsPartial: actionsPartial,
      overridesPartial: overridesPartial,
      parentPartial: parentPartial,
    },

    _onDeleteClick() {
      modal.confirm(i18n.areYouSure, this.deletePrompt).then(() => {
        this.emit("delete", {
          bubbles: false,
          cancelable: false,
        });
        this._onCancelClick();
      });
    },

    _getValueAttr() {
      const obj = this.inherited(arguments);
      const selectedParent = Object.keys(this.folderGrid.selection)[0];
      // Assume obj.feed already includes feed/folder item data e.g. title
      obj.feed.parent = typeof selectedParent === "undefined" ? null : +selectedParent;
      return obj;
    },

    _setValueAttr(value) {
      this.folderGrid.clearSelection();
      if (value.feed.parent) this.folderGrid.select(value.feed.parent);

      this.inherited(arguments);
    },
  });
});
