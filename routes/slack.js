var express = require('express');
var debug = require('debug')('SK:router');
var request = require('request');
var router = express.Router();

router.post('/slap', function(req, res) {
  var user = req.body.user_name;
  var target = req.body.text ? req.body.text : user;
  if (target.charAt(0) !== '@') {target = '@' + target; }
  var channel = req.body.channel_id;

  request({
    method: 'post',
    url: process.env.SLAPBOT_URL,
    json: true,
    body: {
      text: '<@' + user + '> slaps <' + target + '> around a bit with a large trout',
      channel: channel
    }
  }, function(error, response, body) {
    console.log(error, response, body);
    res.end();
  });
});

module.exports = router;
