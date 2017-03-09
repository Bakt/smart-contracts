const path = require('path')
const webpack = require("webpack")
const CopyWebpackPlugin = require('copy-webpack-plugin')

module.exports = {
    entry: './app/javascripts/app.js',
    output: {
        path: path.resolve(__dirname, 'build'),
        filename: 'app.js'
    },
    plugins: [
        new webpack.ProvidePlugin({
            Web3: 'web3'
        }),
        new CopyWebpackPlugin([
            {
                from: './app/index.html',
                to: "index.html"
            }, {
                from: './app/config.json',
                to: "config.json"
            }
        ])
    ],
    module: {
        rules: [
            {
                test: /\.css$/,
                use: ['style-loader', 'css-loader']
            }
        ]
    },
}
