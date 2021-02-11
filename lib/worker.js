'use strict';

const transpiler = require("esbuild");
const BabelTranspiler = require("@babel/core");

const workerpool = require('workerpool');
const Promise = require('rsvp').Promise;
const ParallelApi = require('./parallel-api');

const EmberModuleApiPolyFill = require.resolve("babel-plugin-ember-modules-api-polyfill");
const HTMLBars = require.resolve('babel-plugin-htmlbars-inline-precompile');
const DebugMacros = require.resolve('babel-plugin-debug-macros')

const ignore = {
    "@ember/debug": ["assert", "deprecate", "warn"],
    "@ember/application/deprecations": ["deprecate"],
    "@ember/string": [
      "fmt",
      "loc",
      "w",
      "decamelize",
      "dasherize",
      "camelize",
      "classify",
      "underscore",
      "capitalize",
      "setStrings",
      "getStrings",
      "getString",
    ],
    jquery: "default"
  }

// transpile the input string, using the input options
function transform(string, options) {
  return new Promise(resolve => {
    options = ParallelApi.deserialize(options);
    return transpiler.transform(string, {
      loader: "js",
      sourcefile: options.sourceFileName,
    }).then((result) => {
      return BabelTranspiler.transformAsync(string, {
        plugins: [
            '@babel/transform-modules-amd',
            // HTMLBars,
            [EmberModuleApiPolyFill, {ignore}],
        ]
      }).then((result) => {
          return resolve({
          code: result.code,
          metadata: result.metadata
        });
      });
    });
  });
}

// create worker and register public functions
workerpool.worker({
  transform: transform
});
