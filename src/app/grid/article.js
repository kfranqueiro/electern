define([
  "dojo/_base/declare",
  "dojo/dom-construct",
  "dgrid/extensions/SingleQuery",
  "dgrid/Grid",
  "dgrid/Keyboard",
  "dgrid/Selection",
  "dojo/i18n!../nls/main",
  "dojo/query", // Event delegation
], function (declare, domConstruct, SingleQuery, Grid, Keyboard, Selection, i18n) {
  const dateFormatter = new Intl.DateTimeFormat([], {
    hour: "numeric",
    minute: "2-digit",
    month: "numeric",
    day: "numeric",
    year: "2-digit",
  });

  const ArticleGrid = declare([Grid, SingleQuery, Keyboard, Selection], {
    cellNavigation: false,
    maintainOddEven: false,
    tabableHeader: false,

    postMixInProperties() {
      this.inherited(arguments);
      this.columns = {
        isPinned: {
          renderHeaderCell: function () {
            return domConstruct.create("span", { className: "fa fa-thumb-tack" });
          },
          renderCell: function (item, value) {
            return domConstruct.create("span", {
              className: value ? "fa fa-thumb-tack" : "",
            });
          },
          sortable: false,
        },
        title: {
          label: i18n.title,
          renderCell: function (item, value, cell) {
            cell.textContent = cell.title = value;
          },
        },
        isRead: {
          renderHeaderCell: function () {
            return domConstruct.create("span", { className: "fa fa-bolt" });
          },
          renderCell: function (item, value) {
            return domConstruct.create("span", {
              className: value ? "" : "fa fa-bolt",
            });
          },
          sortable: false,
        },
        date: {
          label: i18n.date,
          renderCell: function (item, value, cell) {
            cell.textContent = cell.title = dateFormatter.format(value);
          },
        },
      };
      this.sort = [{ property: "date", descending: true }, { property: "title" }];
    },

    postCreate() {
      this.inherited(arguments);

      const pin = this.toggleFlag.bind(this, "isPinned");
      const read = this.toggleFlag.bind(this, "isRead");

      this.on(".dgrid-content .field-isPinned:click", pin);
      this.on(".dgrid-content .field-isRead:click", read);

      electronApi.on("feed-mark-all-as-read", () => {
        const collection = this.get("collection");
        if (!collection) return;

        collection.forEach(function (item) {
          if (!item.isRead) {
            item.isRead = true;
            collection.putSync(item);
          }
        });
      });
    },

    highlightRow() {},

    renderRow(item) {
      const rowElement = this.inherited(arguments);
      if (!item.isRead) {
        rowElement.classList.add("unread");
      }
      return rowElement;
    },

    toggleFlag(flag, target) {
      const item = this.row(target).data;
      item[flag] = !item[flag];
      this.collection.putSync(item);
    },
  });

  return new ArticleGrid({}, "articles");
});
