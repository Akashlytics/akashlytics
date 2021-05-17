const path = require("path");
const webpack = require("webpack");
const commonConfig = require("./webpack.common");
const { merge } = require("webpack-merge");
const TerserPlugin = require("terser-webpack-plugin");
module.exports = merge(commonConfig, {
  mode: "production",
  // output: {
  // Can't have content hash into bundle names because we load the bundles dynamically contrary
  // to having the htmlwebpackplugin automatically putting the bundles in the index.html file
  // filename: "[name].[contenthash].bundle.js",
  // chunkFilename: "[name].[contenthash].bundle.js",
  //   path: path.resolve(__dirname, "../NectariComponents/dist"),
  //   publicPath: "/dist/"
  // },
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
