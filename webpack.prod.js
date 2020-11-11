const path = require('path');
const common = require('./webpack.common');
const { merge } = require("webpack-merge");
const { CleanWebpackPlugin } = require("clean-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const HtmlWebpackPlugin = require('html-webpack-plugin');


module.exports = merge(common, {
    mode: "production",
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: 'js/bundle.[contentHash].js',
    },
    plugins: [
        new MiniCssExtractPlugin({ filename: "[name].[contentHash].css" }),
        new CleanWebpackPlugin(),
        new HtmlWebpackPlugin({
            filename: 'index.html',
            template: './src/index.html',
            minify: {
                removeAttributeQuotes: true,
                collapseWhitespace: true,
                removeComments: true,
            }
        }),
    ],
    module: {
        rules: [
            {
                test: /\.css$/,
                use: [MiniCssExtractPlugin.loader, 'css-loader'],
            },
        ]
    }
});

