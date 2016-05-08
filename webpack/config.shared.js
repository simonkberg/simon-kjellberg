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

export function getPlugins (opts = {}) {
  const { env = process.env.NODE_ENV, browser } = opts

  let plugins = [
    new webpack.DefinePlugin({
      'process.env.NODE_ENV': `"${env || 'development'}"`,
      '__DEV__': env !== 'production',
      '__BROWSER__': !!browser
    })
  ]

  if (env === 'production') {
    plugins.push(new webpack.LoaderOptionsPlugin({
      minimize: true,
      debug: false,
      sourceMap: false
    }))
    plugins.push(new webpack.optimize.UglifyJsPlugin({
      compress: { warnings: false },
      output: { comments: false }
    }))
  } else {
    plugins.push(new webpack.LoaderOptionsPlugin({
      debug: true
    }))
    plugins.push(new webpack.HotModuleReplacementPlugin())
    plugins.push(new webpack.NoErrorsPlugin())
  }

  return plugins
}

export function getLoaders (opts = {}) {
  let loaders = [{
    test: /\.js$/,
    loader: 'babel',
    exclude: /node_modules/,
    include: paths.app,
    query: { cacheDirectory: true }
  }, {
    test: /\.css$/,
    loaders: [
      'isomorphic-style',
      {
        loader: 'css',
        query: {
          modules: true,
          importLoaders: 1,
          sourceMap: true,
          name: '[name]_[local]_[hash:base64:3]'
        }
      },
      {
        loader: 'postcss',
        query: { sourceMap: true }
      }
    ]
  }, {
    test: /\.(json)$/,
    loader: 'json'
  }, {
    test: /\.(png|jpe?g|gif|svg)$/,
    loaders: [
      {
        loader: 'url',
        query: {
          limit: 10000,
          name: '[name]-[hash].[ext]'
        }
      },
      'img'
    ]
  }, {
    test: /\.(woff2?)$/,
    loader: 'url',
    query: {
      limit: 10000,
      name: '[name]-[hash].[ext]'
    }
  }]

  return loaders
}

export default function sharedConfig (opts = {}) {
  const config = {
    devtool: '#cheap-module-eval-source-map',

    context: paths.app,

    output: {
      path: paths.build,
      filename: '[name].[hash].js',
      publicPath: '/'
    },

    plugins: getPlugins(opts),

    resolve: {
      extensions: ['', '.js', '.json'],
      modules: [paths.app, 'node_modules']
    },

    module: {
      loaders: getLoaders(opts)
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
