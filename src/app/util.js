"use strict";
define(["dojo/_base/lang"], function (lang) {
  const parser = new DOMParser();

  return {
    /**
     * Parses XML into a document object. Throws on parse error.
     */
    parseXml: function (xml) {
      xml = xml.slice(xml.indexOf("<?xml")); // Trim any invalid leading comments/etc.
      const doc = parser.parseFromString(xml, "application/xml");
      const error = doc.querySelector("parsererror");
      if (error) {
        throw new Error(error.innerText);
      }
      return doc;
    },

    /**
     * Flattens any nested objects into top-level keys with dot notation.
     */
    flatten(obj) {
      const toString = Object.prototype.toString;
      let found = true;
      while (found) {
        found = false;
        for (let key in obj) {
          const nestedObj = obj[key];
          if (toString.call(nestedObj) !== "[object Object]") {
            continue;
          }
          found = true;
          for (let nestedKey in nestedObj) {
            obj[key + "." + nestedKey] = nestedObj[nestedKey];
          }
          delete obj[key];
        }
      }
      return obj;
    },

    /**
     * Scans an object for dot-delimited property names, and rearranges them into a nested structure.
     */
    unflatten(obj) {
      for (let key in obj) {
        if (key.includes(".")) {
          lang.setObject(key, obj[key], obj);
          delete obj[key];
        }
      }
      return obj;
    },
  };
});
