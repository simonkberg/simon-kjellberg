const path = require('path')
const webpack = require('webpack')

const paths = {}

paths.config = __dirname
paths.root = path.join(paths.config, '..')
paths.build = path.join(paths.root, 'build')
paths.src = path.join(paths.root, 'src')

function getEntry (entry, hot = false) {
  // cast to array
  entry = [].concat(entry)

  if (hot) {
    entry.push('webpack-hot-middleware/client')
  }

  return entry
}

function getPlugins (opts = {}) {
  const {
    env = process.env.NODE_ENV,
    gaid = process.env.GA_ID,
    browser,
  } = opts

  let plugins = [
    new webpack.DefinePlugin({
      'process.env': {
        NODE_ENV: `"${env || 'development'}"`,
        GA_ID: `"${gaid || ''}"`,
      },
      '__DEV__': env !== 'production',
      '__BROWSER__': !!browser,
    }),
  ]

  if (env === 'production') {
    plugins.push(new webpack.LoaderOptionsPlugin({
      minimize: true,
      debug: true,
    }))
    plugins.push(new webpack.optimize.UglifyJsPlugin({
      compress: {
        warnings: false,
        drop_console: true,
      },
      output: { comments: false },
    }))
  } else {
    plugins.push(new webpack.LoaderOptionsPlugin({
      debug: true,
    }))
    plugins.push(new webpack.HotModuleReplacementPlugin())
    // plugins.push(new webpack.NoErrorsPlugin())
  }

  return plugins
}

function getLoaders (opts = {}) {
  const { env = process.env.NODE_ENV } = opts
  const isDev = env !== 'production'

  let loaders = [{
    test: /\.js$/,
    loaders: [
      {
        loader: 'babel',
        query: { cacheDirectory: true },
      },
      'eslint-loader',
    ],
    exclude: /node_modules/,
    include: paths.src,
  }, {
    test: /\.css$/,
    loaders: [
      'isomorphic-style',
      {
        loader: 'css',
        query: {
          modules: true,
          sourceMap: isDev,
          importLoaders: 1,
          localIdentName: isDev
            ? '[name]__[local]__[hash:base64:5]'
            : '[hash:base64]',
        },
      },
      {
        loader: 'postcss',
        query: { sourceMap: isDev },
      },
    ],
  }, {
    test: /\.(json)$/,
    loader: 'json',
  }, {
    test: /\.(png|jpe?g|gif|svg)$/,
    loaders: [
      {
        loader: 'url',
        query: {
          limit: 10000,
          name: '[name]-[hash].[ext]',
        },
      },
      'img',
    ],
  }, {
    test: /\.(woff2?)$/,
    loader: 'url',
    query: {
      limit: 10000,
      name: '[name]-[hash].[ext]',
    },
  }]

  return loaders
}

module.exports = exports = function sharedConfig (opts = {}) {
  const { env = process.env.NODE_ENV } = opts

  const config = {
    devtool: env !== 'production'
      ? '#cheap-module-eval-source-map'
      : 'hidden-sourcemap',

    context: paths.src,

    output: {
      path: paths.build,
      filename: '[name].[hash].js',
      publicPath: '/',
    },

    plugins: getPlugins(opts),

    resolve: {
      extensions: ['', '.js', '.json'],
      modules: [paths.src, 'node_modules'],
    },

    module: {
      loaders: getLoaders(opts),
    },

    postcss: function (webpack) {
      return [
        require('postcss-import')({
          path: [paths.src],
          addDependencyTo: webpack,
        }),
        require('postcss-url')(),
        require('postcss-cssnext')({ browsers: ['last 2 versions'] }),
        require('postcss-reporter')(),
      ]
    },
  }

  return config
}

exports.paths = paths
exports.getEntry = getEntry
exports.getPlugins = getPlugins
exports.getLoaders = getLoaders
