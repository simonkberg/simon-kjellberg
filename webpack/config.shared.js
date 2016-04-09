import path from 'path'
import webpack from 'webpack'

export const paths = {}

paths.config = __dirname
paths.root = path.join(paths.config, '..')
paths.build = path.join(paths.root, 'build')
paths.app = path.join(paths.root, 'app')

export function getEntry (entry, hot = false) {
  // cast to array
  entry = [].concat(entry)

  if (hot) {
    entry.push('webpack-hot-middleware/client')
  }

  return entry
}

export function getPlugins (env = process.env.NODE_ENV) {
  let plugins = [
    new webpack.optimize.OccurrenceOrderPlugin(),
    new webpack.DefinePlugin({
      'process.env.NODE_ENV': `"${env || 'development'}"`
    })
  ]

  if (env === 'production') {
    plugins.push(new webpack.optimize.UglifyJsPlugin({
      compress: {
        warnings: false
      },
      minimize: true,
      sourceMap: false
    }))
  } else {
    plugins.push(new webpack.HotModuleReplacementPlugin())
    plugins.push(new webpack.NoErrorsPlugin())
  }

  return plugins
}

export function getLoaders (env = process.env.NODE_ENV) {
  let loaders = [{
    test: /\.js$/,
    loader: 'babel?cacheDirectory',
    exclude: /node_modules/,
    include: paths.app
  }, {
    test: /\.css$/,
    loaders: [
      'isomorphic-style',
      'css?modules&importLoaders=1&sourceMap',
      'postcss?sourceMap'
    ]
  }, {
    test: /\.(json)$/,
    loader: 'json'
  }, {
    test: /\.(png|jpe?g|gif|svg)$/,
    loader: 'url?limit=10000&name=[name]-[hash].[ext]!img'
  }]

  return loaders
}

export default function sharedConfig (opts = {}) {
  const dev = !!(opts.env !== 'production')

  const config = {
    devtool: '#cheap-module-eval-source-map',
    debug: dev,

    output: {
      path: paths.build,
      filename: '[name].[hash].js',
      publicPath: '/'
    },

    plugins: getPlugins(opts.env),

    resolve: {
      root: [paths.app]
    },

    module: {
      loaders: getLoaders(opts.env)
    },

    postcss: function (webpack) {
      return [
        require('postcss-import')({
          path: [paths.app],
          addDependencyTo: webpack
        }),
        require('postcss-url')(),
        require('postcss-cssnext')({ browsers: ['last 2 versions'] }),
        require('postcss-reporter')()
      ]
    }
  }

  return config
}
