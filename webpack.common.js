const path = require('path');

module.exports = {
    entry: ['./src/js/app.js'],
    devServer: {
        contentBase: './dist',
    },
    module: {
        rules: [
            {
                test: /\.js$/,
                exclude: /node_modules/,
                use: {
                    loader: 'babel-loader',
                },
            },
            {
                test: /\.html$/,
                use: ['html-loader?minimize=false'],
            },
            {
                test: /\.(svg|png|gif|jpg|jpeg)$/,
                use: {
                    loader: 'file-loader',
                    options: {
                        name: '[name].[hash].[ext]',
                        outputPath: 'assets',
                    },
                }
            },
        ],
    },
};
