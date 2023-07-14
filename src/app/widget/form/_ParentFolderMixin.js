define(["dojo/_base/declare", "../../grid/feed"], function (declare, feedGrid) {
  /** Mixin designed for use with the parent partial. */
  return declare(null, {
    buildRendering() {
      this.inherited(arguments);
      const grid = (this.folderGrid = new feedGrid.constructor(
        {
          shouldExpand: function () {
            return true;
          },
          showUnread: false,
        },
        this.folderGridNode
      ));
      this.own(grid);
    },

    startup() {
      if (this._started) return;

      this.inherited(arguments);
      this.folderGrid.startup();
    },

    resize() {
      this.inherited(arguments);
      this.folderGrid.resize();
    },

    _setFolderCollectionAttr(collection) {
      this._set("folderCollection", collection);
      this.folderGrid.set("collection", collection);
    },

    _onTopLevelClick() {
      this.folderGrid.clearSelection();
    },
  });
});
