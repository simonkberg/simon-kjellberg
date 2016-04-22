import path from 'path'
import AssetsPlugin from 'assets-webpack-plugin'
import sharedConfig, { paths, getEntry } from './config.shared'

export default function (opts = {}) {
  const config = sharedConfig(opts)

  return Object.assign(config, {
    name: 'client',
    target: 'web',

    entry: {
      client: getEntry(
        path.join(paths.app, 'client.js'),
        opts.env !== 'production'
      )
    },

    plugins: [
      ...config.plugins,
      new AssetsPlugin({
        filename: 'manifest.json',
        path: path.join(paths.build)
      })
    ]
  })
}
