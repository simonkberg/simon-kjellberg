import express from 'express'
import fs from 'fs'

const router = express.Router()

// GET index.
router.get('/', (req, res, next) => {
  res.render('exp/index', { title: '~/exp' })
})

// GET monotalic.
router.get('/italicize.js', (req, res, next) => {
  let script = './src/js/exp/italicize.js'
  fs.readFile(script, {encoding: 'utf-8'}, (err, data) => {
    if (err) next(err)

    res.render('exp/italicize', {
      title: '~/exp/italicize.js',
      code: data
    })
  })
})

router.get('/vendor/:path*', (req, res) => {
  let path = req.params.path + req.params[0]
  res.sendFile(path, {root: './bower_components'})
})

export default router
