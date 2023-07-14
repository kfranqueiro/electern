"use strict";

define([
  "dojo/on",
  "dgrid/util/misc",
  "./grid/article",
  "./grid/feed",
  "common/userConfig",
], function (on, miscUtil, articleGrid, feedGrid, userConfig) {
  on(
    window,
    "resize",
    miscUtil.debounce(
      async () => {
        userConfig.uiOptions.size = await electronApi.getWindowSize();
        userConfig.save();
      },
      null,
      250
    )
  );

  let regionStyles = [];

  function resizeRegions() {
    regionStyles.forEach(function (style) {
      style.remove();
    });

    regionStyles = [];

    const sizes = userConfig.uiOptions.regionSizes;
    let total = 0;

    for (let key in sizes) {
      total += sizes[key];
      regionStyles.push(miscUtil.addCssRule("." + key, "width: " + sizes[key] + "%"));
    }
    regionStyles.push(miscUtil.addCssRule(".article", "width: " + (100 - total) + "%"));

    articleGrid.resize();
    feedGrid.resize();
  }

  resizeRegions();

  return resizeRegions;
});
