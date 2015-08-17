var express = require('express');
var debug = require('debug')('SK:router');
var request = require('request');
var router = express.Router();

router.post('/slap', function(req, res) {
  var user = req.body.user_name;
  var target = req.body.text ? req.body.text : 'themselves';
  var channel = rew.body.channel_id;

  request({
    method: 'post',
    url: process.env.SLAPBOT_URL,
    json: true,
    body: {
      payload: {
        text: user + ' slaps ' + target + ' around a bit with a large trout',
        channel: channel
      }
    }
  }, function() {
    res.send();
  });
});

module.exports = router;
