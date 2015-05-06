var Dashboard = require('performanceplatform-client.js').Dashboard;
var validator = require('is-my-json-valid');
var validateDashboard = validator(require('../schema/dashboard.json'));
var Q = require('q');
var failed = false;

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