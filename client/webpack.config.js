/* eslint-disable */

const path = require("path");
const CopyPlugin = require("copy-webpack-plugin");
// const { readFileSync } = require("fs");

module.exports = {
  entry: "./src/index.ts",

  watch: true,

  mode: "development",
  devtool: "source-map",

  // devServer: {
  // https: true,
  // port: 443,
  // key: readFileSync(path.join(__dirname, "../certs/server-key.pem")),
  // cert: readFileSync(path.join(__dirname, "../certs/server-cert.pem")),
  // },

  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: "ts-loader",
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    extensions: [".tsx", ".ts", ".js"],
  },

  output: {
    path: path.resolve(__dirname, "dist"),
    filename: "bundle.js",
  },

  plugins: [
    new CopyPlugin({
      patterns: [{ from: "index.html" }],
    }),
  ],
};
