'use strict'

const fs = require('fs')
const path = require('path')
const del = require('del')
const exec = require('child_process').exec
const le = require('letiny')

const paths = {}
paths.root = path.join(__dirname, '..')
paths.static = path.join(paths.root, 'static')
paths.certs = path.join(paths.root, 'ssl')
paths.chain = path.join(paths.certs, 'chain.pem')

var options = {
  email: 'admin@simonkjellberg.com',
  domains: [
    'simonkjellberg.com',
    'www.simonkjellberg.com',
    'simonkjellberg.se',
    'www.simonkjellberg.se',
  ],
  webroot: paths.static,
  certFile: path.join(paths.certs, 'cert.pem'),
  caFile: path.join(paths.certs, 'ca.pem'),
  privateKey: path.join(paths.certs, 'key.pem'),
  accountKey: path.join(paths.certs, 'account.pem'),
  agreeTerms: true,
}

try {
  fs.accessSync(paths.certs, fs.W_OK)
} catch (err) {
  if (err.code === 'ENOENT') {
    fs.mkdirSync(paths.certs)
  } else {
    throw err
  }
}

le.getCert(options, (err, cert, pkey, ca, akey) => {
  if (err) throw err

  fs.writeFileSync(paths.chain, `${cert}\n${ca}`)

  del(path.join(paths.static, '.well-known', 'acme-challenge'))

  exec('sudo service nginx reload')
})
