import path from 'path'
import nodeExternals from 'webpack-node-externals'
import sharedConfig, { paths } from './config.shared'

export default function (opts = {}) {
  const config = sharedConfig(opts)

  return Object.assign(config, {
    name: 'server',
    devtool: 'eval',
    target: 'node',

    entry: {
      server: path.join(paths.app, 'server.js')
    },

    output: {
      path: paths.build,
      filename: 'server.js',
      libraryTarget: 'commonjs2'
    },

    externals: [nodeExternals()],

    node: {
      __filename: true,
      __dirname: true
    }
  })
}
