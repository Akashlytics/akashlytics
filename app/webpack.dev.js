const path = require("path");
const commonConfig = require("./webpack.common");
const { merge } = require("webpack-merge");
const webpack = require("webpack");

module.exports = merge(commonConfig, {
  mode: "development",
  target: "web",
  devtool: "eval-source-map",
  devServer: {
    contentBase: "./dist",
    compress: true,
    port: 3000,
    watchContentBase: true,
    hot: true,
    proxy: {
      context: ["/api", "/web3-index"],
      target: "http://localhost:3080"
    },
    historyApiFallback: true
  },
  plugins: [
    new webpack.DefinePlugin({
      "process.env": { PACKAGE_VERSION: JSON.stringify(require("./package.json").version) }
    })
  ]
});
