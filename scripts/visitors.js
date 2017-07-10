var cp = require("../node_modules/node-cp/cp.js");

// Copy all visitors from ./visitors to as3-to-ts visitor folders.
cp("visitors", "../lib/custom-visitors", function () {
    console.log("preparing as3-to-ts visitors...\n");
});
