import express from 'express'
const router = express.Router()

/* GET home page. */
router.get('/', (req, res, next) => {
  res.render('index', { title: 'Simon Kjellberg' })
})

router.get('/ping', (req, res, next) => {
  res.send('pong')
})

router.get('/vendor/:path*', (req, res) => {
  let path = req.params.path + req.params[0]
  res.sendFile(path, {root: './bower_components'})
})

export default router
