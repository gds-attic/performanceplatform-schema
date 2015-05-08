var Dashboard = require('performanceplatform-client.js').Dashboard;
var validator = require('is-my-json-valid');
var validateDashboard = validator(require('../schema/dashboard.json'));
var Q = require('q');
var failed = false;
var knownSchemas = {
  'kpi': true,
  'realtime': true
};

Dashboard.getAllSlugs().then(function (listOfSlugs) {
  var allDashboards = [];
  listOfSlugs.forEach(function (slug) {
    console.log(slug);
    var dash = new Dashboard(slug);

    allDashboards.push(dash.getConfig());
  });

  return Q.allSettled(allDashboards).then(function (results) {
    results.forEach(function (result) {
      if (result.state === 'fulfilled') {
        var dashboard = result.value;
        var valid = validateDashboard(dashboard);
        validateModules(dashboard);

        if (valid === false) {
          console.log('Schema validation failed for (', dashboard.slug, ')');
          console.log(validateDashboard.errors);
          failed = true;
        }
      }
    });
  }).then(function () {
    if (failed) {
      process.exit(1);
    } else {
      process.exit(0);
    }
  });
});

function validateModules (dashboard) {
  var modules = dashboard.modules;
  modules.forEach(function (module) {
    var moduleType = module['module-type'];
    if (knownSchemas[moduleType]) {
      var validateModule = validator(require('../schema/modules/' + moduleType + '.json'));
      var valid = validateModule(module);

      if (valid === false) {
        console.log('Schema validation failed for (', dashboard.slug + '/' + module.slug, ')');
        console.log(validateModule.errors);
        failed = true;
      }
    }
  });
}