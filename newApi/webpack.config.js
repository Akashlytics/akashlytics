const path = require("path");
const { NODE_ENV = "production" } = process.env;
const NodemonPlugin = require("nodemon-webpack-plugin");
const nodeExternals = require("webpack-node-externals");

module.exports = {
  entry: "./src/index.ts",
  mode: NODE_ENV,
  target: "node",
  output: {
    path: path.resolve(__dirname, "dist"),
    filename: "server.js",
  },
  resolve: {
    extensions: [".ts", ".js"],
  },
  externals: [nodeExternals()],
  module: {
    rules: [
      {
        test: /\.(ts|js)x?$/,
        exclude: /node_modules/,
        loader: "ts-loader",
      },
    ],
  },
  plugins: [new NodemonPlugin()],
};
