/* eslint-disable */

const withTypescript = require("@zeit/next-typescript");
const withSass = require("@zeit/next-sass");
const withTM = require("next-transpile-modules");

module.exports = withTypescript(
  withTM(
    withSass({
      transpileModules: ["react-bulma-components"],
      sassLoaderOptions: {
        includePaths: ["."],
      },
    }),
  ),
);
