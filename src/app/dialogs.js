define([
  "dojo/_base/lang",
  "dojo/promise/all",
  "dojo/topic",
  "./grid/feed",
  "./store/article",
  "./store/feed",
  "./store/util",
  "./widget/form/Add",
  "./widget/form/Feed",
  "./widget/form/Folder",
  "./widget/form/Preferences",
  "./widget/form/Search",
  "./widget/form/modal",
  "./refresh",
  "./resize",
  "common/userConfig",
  "dojo/i18n!./nls/main",
], function (
  lang,
  all,
  topic,
  feedGrid,
  articleStore,
  feedStore,
  storeUtil,
  AddForm,
  FeedForm,
  FolderForm,
  PreferencesForm,
  SearchForm,
  modal,
  refresh,
  resize,
  userConfig,
  i18n
) {
  const folderCollection = feedStore.getRootCollection().filter(function (item) {
    return feedStore.mayHaveChildren(item);
  });
  const addForm = new AddForm({ folderCollection: folderCollection });
  const feedForm = new FeedForm({ folderCollection: folderCollection });
  const folderForm = new FolderForm(); // folderCollection is set when displayed
  const searchForm = new SearchForm();
  const preferencesForm = new PreferencesForm();

  let shouldDelete;

  function findNearestFolderId() {
    const selectedId = Object.keys(feedGrid.selection)[0];
    if (selectedId) {
      const item = feedStore.getSync(selectedId);
      return feedStore.mayHaveChildren(item) ? item.id : item.parent;
    }
    return null;
  }

  function setDelete() {
    shouldDelete = true;
  }
  feedForm.on("delete", setDelete);
  folderForm.on("delete", setDelete);

  const dialogs = {
    showAddFeed() {
      modal
        .show(addForm)
        .then(function (value) {
          return storeUtil.addFeed(value.input, value.parent);
        })
        .then(function (feed) {
          feedGrid.focus(feedGrid.row(feed).element);
          return all([articleStore.persist(), feedStore.persist()]);
        });
      // Reset after showing to allow dgrid selection to find element in DOM and decorate properly
      addForm.reset("feed", findNearestFolderId());
    },

    showAddFolder() {
      modal.show(addForm).then(function (value) {
        feedGrid.focus(feedGrid.row(storeUtil.addFolder(value.input, value.parent)).element);
        return feedStore.persist();
      });
      addForm.reset("folder", findNearestFolderId());
    },

    showEditFeed(item) {
      let value = { feed: item };
      let form;
      shouldDelete = false;

      if (feedStore.mayHaveChildren(item)) {
        form = folderForm;
        form.set(
          "folderCollection",
          folderCollection.filter(function (i) {
            return i !== item;
          })
        );
      } else {
        form = feedForm;
        value.config = userConfig.feedOptions[item.id];
      }

      modal
        .show(form)
        .then(
          function (value) {
            const isFeedChanged = value.feed.url !== item.url;

            feedStore.put(lang.mixin(item, value.feed));

            if (isFeedChanged) refresh(item);

            if (value.config) {
              userConfig.setOptions(item.id, value.config);
              userConfig.save();
            }
          },
          function () {
            if (shouldDelete) {
              if (feedStore.mayHaveChildren(item)) {
                const parents = {};
                feedStore.getFeeds(item).forEach(function (feed) {
                  parents[feed.parent] = true;
                  storeUtil.removeFeed(feed.id);
                });

                for (let id in parents) {
                  feedStore.removeSync(id);
                }

                feedStore.removeSync(item.id);
              } else {
                storeUtil.removeFeed(item.id);
              }
            }
          }
        )
        .always(function () {
          feedGrid.focus();
        });

      form.set("value", value);
    },
  };

  electronApi.on("new-feed", dialogs.showAddFeed);
  electronApi.on("new-folder", dialogs.showAddFolder);

  electronApi.on("feed-edit", function () {
    const selected = Object.keys(feedGrid.selection)[0];
    if (selected && !feedStore.getSync(selected)._system) {
      dialogs.showEditFeed(feedGrid.row(selected).data);
    }
  });

  electronApi.on("article-search", function () {
    searchForm.set("value", {
      query: "",
    });
    modal.show(searchForm).then(function (value) {
      topic.publish("/search", new RegExp(value.query, "i"));
      const searchItem = feedStore.getSync("search");
      searchItem.title = i18n.searchResults + " - " + value.query;
      feedStore.putSync(searchItem);
      feedGrid.clearSelection();
      feedGrid.select("search");
    });
  });

  electronApi.on("preferences", function () {
    preferencesForm.set("value", {
      config: userConfig.defaultOptions,
      uiOptions: userConfig.uiOptions,
    });
    modal.show(preferencesForm).then(function (value) {
      userConfig.defaultOptions = value.config;
      lang.mixin(userConfig.uiOptions, value.uiOptions);
      userConfig.save();
      resize();
    });
  });

  return dialogs;
});
