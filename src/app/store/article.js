define(["dstore/Trackable", "./FsMemory", "common/userConfig"], function (
  Trackable,
  FsMemory,
  userConfig
) {
  const ArticleStore = FsMemory.createSubclass([Trackable], {
    addSync(item) {
      const existingItem = this.getSync(item.id);
      if (existingItem) {
        // Bail out rather than throwing an error
        return existingItem;
      }

      return this.inherited(arguments);
    },

    removeSync(id) {
      const item = this.getSync(id);
      if (item && item.archive && electronApi.existsSync(item.archive)) {
        electronApi.unlinkSync(item.archive);
      }
      return this.inherited(arguments);
    },

    prune(feedId) {
      "use strict";

      // Clean up any unreachable archive files
      this.filter(
        (article) => !!article.archive && !electronApi.existsSync(article.archive)
      ).forEach((article) => {
        delete article.archive;
      });

      // Remove old unpinned items beyond maximum
      const data = this.filter((article) => article.feedId === feedId && !article.isPinned)
        .sort([{ property: "date" }])
        .fetchSync();
      const numToRemove = data.length - userConfig.getOptions(feedId).maxTotal;

      for (let i = 0; i < numToRemove; i++) {
        this.removeSync(data[i].id);
      }
    },

    setData(data) {
      data.forEach(function (article) {
        if (article.pdf && !electronApi.existsSync(article.pdf)) {
          delete article.pdf;
        }
      });

      this.inherited(arguments);
    },
  });

  return new ArticleStore();
});
