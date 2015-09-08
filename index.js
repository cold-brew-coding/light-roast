module.exports = function (name, config) {
  var LightRoast = require('./lib/LightRoast.js');

  config.isRoot = true; // Flag this as the root command
  return new LightRoast(name, config); // Always return a new object
};