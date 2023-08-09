const path = require('path')
const webpack = require('webpack')
const pkg = require('./package.json')

module.exports = [
  {
    entry: './index.js',
    target: 'web',
    output: {
      path: path.resolve(__dirname, 'dist'),
      filename: 'bitpacket.bundle.js',
      library: {
        name: 'bsv',
        type: 'umd2'
      }
    },
    resolve: {
      fallback:{
	"buffer": require.resolve("buffer/"),
       "crypto": require.resolve("crypto-browserify"),
       "stream": require.resolve("stream-browserify"),
	 "util": require.resolve("util/"),
	'process/browser': require.resolve('process/browser')
      },
      alias: {
        process: 'process/browser'
      }
    },
    plugins: [
      new webpack.ProvidePlugin({
        process: 'process/browser',
      })
    ],
    devtool: 'source-map',
    mode: 'production'
  },
  {
    entry: './index.js',
    target: 'node',
    output: {
      path: path.resolve(__dirname, 'dist'),
      filename: 'bitpacket.module.js',
      library: {
        type: 'commonjs-module'
      }
    },
    devtool: 'source-map',
    mode: 'production'
  },
  {
    entry: './index.js',
    target: 'node',
    output: {
      path: path.resolve(__dirname, 'dist'),
      filename: 'bitpacket.cjs.js',
      library: {
        type: 'commonjs2'
      }
    },
    devtool: 'source-map',
    mode: 'production'
  }
]
