const path = require("path");
const commonConfig = require("./webpack.common");
const { merge } = require("webpack-merge");

module.exports = merge(commonConfig, {
  mode: "development",
  devtool: "eval-source-map",
  devServer: {
    contentBase: path.join(__dirname, "./dist"),
    publicPath: "/dist",
    compress: true,
    port: 3000,
    proxy: {
      context: () => true,
      target: "http://localhost:3080",
    },
  },
});
