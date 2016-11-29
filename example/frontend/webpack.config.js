'use strict';

var path = require('path')
var webpack = require('webpack')

var RELEASE = process.env.NODE_ENV == 'production' ? true : false;
var APP = process.env.APP || 'app'

var nodeEnvPlugin = new webpack.DefinePlugin({
  'process.env.NODE_ENV': RELEASE ? '"production"' : '"development"'
})

// Added in for ERROR in ./~/react-tap-event-plugin/src/injectTapEventPlugin.js
var reactDomLibPath = path.join(__dirname, "./node_modules/react-dom/lib");
var alias = {};
["EventPluginHub", "EventConstants", "EventPluginUtils", "EventPropagators",
 "SyntheticUIEvent", "CSSPropertyOperations", "ViewportMetrics"].forEach(function(filename){
    alias["react/lib/"+filename] = path.join(__dirname, "./node_modules/react-dom/lib", filename);
});

module.exports = {
  devtool: RELEASE ? [] : [
    'source-map'
  ],
  entry: [
    './src/index'
  ],
    
  output: {
    path: path.join(__dirname, 'dist'),
    filename: 'app.js'
  },

  resolve: {
    extensions: ['', '.js', '.jsx'],
    /*alias: {
      react: path.resolve('./node_modules/react')
    }*/
    alias: alias
  },

  plugins: RELEASE ? [

    nodeEnvPlugin,

    new webpack.optimize.UglifyJsPlugin({
      minimize: true,
      compress: {
        warnings: false
      }
    })
  ] : [
    nodeEnvPlugin
  ],

  module: {
    loaders: [
      {
        test: /.jsx?$/,
        loader: 'babel-loader',
        exclude: /node_modules/,
        query: {
          presets: ['es2015', 'react', 'stage-1']
        }
      }

    ]
  }
};