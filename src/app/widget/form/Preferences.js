define([
  "./_Base",
  "dojo/text!./templates/Preferences.html",
  "dojo/text!./templates/partials/actions.html",
  "dojo/text!./templates/partials/overrides.html",
], function (_Base, template, actionsPartial, overridesPartial) {
  return _Base.createSubclass({
    templateString: template,
    partials: {
      actionsPartial: actionsPartial,
      overridesPartial: overridesPartial,
    },
  });
});
