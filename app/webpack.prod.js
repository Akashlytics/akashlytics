const path = require("path");
const webpack = require("webpack");
const commonConfig = require("./webpack.common");
const { merge } = require("webpack-merge");
const TerserPlugin = require("terser-webpack-plugin");

module.exports = merge(commonConfig, {
  mode: "production",
  devtool: "cheap-module-source-map",
  optimization: {
    minimize: true,
    minimizer: [new TerserPlugin()],
  },
  plugins: [
    new webpack.DefinePlugin({
      "process.env.NODE_ENV": JSON.stringify("production"),
    }),
    // new webpack.HashedModuleIdsPlugin()
  ],
});
