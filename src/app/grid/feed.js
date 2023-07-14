define([
  "dojo/_base/declare",
  "dojo/dom-construct",
  "dgrid/extensions/SingleQuery",
  "dgrid/Grid",
  "dgrid/Keyboard",
  "dgrid/Selection",
  "dgrid/Tree",
], function (declare, domConstruct, SingleQuery, Grid, Keyboard, Selection, Tree) {
  function renderCell(item, value, cell) {
    const unread = this.grid.collection.getUnread(item);
    if (this.grid.showUnread) cell.classList.toggle("unread", !!unread);

    if (!item._system) {
      domConstruct.create(
        "span",
        {
          className: "fa fa-pencil",
        },
        cell
      );
    }

    cell.appendChild(document.createTextNode(value + (unread ? " (" + unread + ")" : "")));
  }

  const FeedGrid = declare([Grid, SingleQuery, Keyboard, Selection, Tree], {
    enableTreeTransitions: false,
    maintainOddEven: false,
    selectionMode: "single",
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
            const node = this.grid._defaultRenderExpando.apply(this, arguments);
            if (hasChildren) {
              node.className = "dgrid-expando-icon fa fa-folder";
            } else {
              node.className = "fa fa-fw fa-" + (item.icon || "rss");
            }
            return node;
          },
        },
      };
      this.sort = [{ property: "_system", descending: true }, { property: "title" }];
    },

    postCreate() {
      this.inherited(arguments);

      // Allow clearing selection by clicking in empty space in content node,
      // mainly to make it easier to create top-level feeds/folders (by selecting nothing)
      this.on(".dgrid-content:click", (event) => {
        if (event.target === this.contentNode) {
          this.clearSelection();
        }
      });
    },

    highlightRow() {},

    _cleanupCollection() {
      this.inherited(arguments);
      if (this._collectionUpdateHandle) {
        this._collectionUpdateHandle.remove();
      }
    },

    _setCollection(collection) {
      this.inherited(arguments);

      if (this._collectionUpdateHandle) {
        this._collectionUpdateHandle.remove();
      }

      if (this.showUnread && collection) {
        this._collectionUpdateHandle = collection.on("update", (event) => {
          let item = event.target;
          if (item.url) {
            // Unread count may have been updated; update unread count displayed on ancestors.
            // Re-call refreshCell rather than calling put, which would make the grid
            // re-render the entire row _and_ its children.
            // (refreshCell loses level information, but that's worked around in renderExpando above.)
            while (item.parent != null) {
              item = this.collection.getSync(item.parent);
              const cell = this.cell(item, "title");
              if (cell && cell.element) this.refreshCell(cell);
            }
          }
        });
      }
    },
  });

  return new FeedGrid({}, "feeds");
});
