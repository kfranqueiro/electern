"use strict";
define(["dstore/Memory"], function (Memory) {
  /**
   * Memory store which persists to / restores from a file in the filesystem.
   */
  return Memory.createSubclass({
    /**
     * Filename to read/write
     */
    filename: "",

    constructor() {
      if (this.filename) {
        this.setFilename(this.filename);
      }
    },

    _persist(sync) {
      if (this.filename) {
        return (sync ? electronApi.writeFileSync : electronApi.writeFile)(
          this.filename,
          JSON.stringify(this, null, "\t")
        );
      }
      throw new Error("Cannot persist without a filename defined");
    },

    persist() {
      this._persist();
    },

    persistSync() {
      this._persist(true);
    },

    setFilename(filename) {
      // This uses synchronous methods to enable flowing directly into setData,
      // rather than needing to notify of adds afterwards.
      // Note that this accepts nonexistent filenames as well, to allow persisting on first run.

      if (electronApi.existsSync(filename)) {
        this.setData(
          JSON.parse(
            electronApi.readFileSync(filename, { encoding: "utf8" }),
            function (key, value) {
              if (key.slice(-4).toLowerCase() === "date") {
                return new Date(value);
              }
              return value;
            }
          )
        );
      } else {
        this.setData([]);
      }

      this.filename = filename;
    },

    toJSON() {
      return this.storage.fullData;
    },
  });
});
