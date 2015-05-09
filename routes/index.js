var express = require('express');
var debug = require('debug')('SK:router');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Simon Kjellberg' });
});

router.get('/vendor/:path*', function(req, res) {
  var path = req.params.path + req.params[0];
  res.sendFile(path, {root: './bower_components'});
});

module.exports = router;
