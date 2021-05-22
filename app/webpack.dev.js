const path = require("path");
const commonConfig = require("./webpack.common");
const { merge } = require("webpack-merge");

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
      context: ["/api"],
      target: "http://localhost:3080",
    },
    historyApiFallback: true,
  },
});
