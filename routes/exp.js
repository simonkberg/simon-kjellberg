var express = require('express');
var fs = require('fs');
var debug = require('debug')('SK:router');
var router = express.Router();

/* GET index. */
router.get('/', function(req, res, next) {
  res.render('exp/index', { title: 'Experiments' });
});

/* GET monotalic. */
router.get('/monotalic.js', function(req, res, next) {
  var script = './src/js/exp/monotalic.jsx';
  fs.readFile(script, {encoding: 'utf-8'}, function(err, data) {
    res.render('exp/monotalic', {
      title: '~/exp/monotalic.js',
      code: data
    });
  });
});

router.get('/vendor/:path*', function(req, res) {
  var path = req.params.path + req.params[0];
  res.sendFile(path, {root: './bower_components'});
});

module.exports = router;
