var express = require('express');
var debug = require('debug')('SK:router');
var request = require('request');
var router = express.Router();

var parseTime = require('../lib/parseTime');
var timeDiff = require('../lib/timeDiff');
var timeDiffFormat = require('../lib/timeDiffFormat');
var clockEmoji = require('../lib/clockEmoji');

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
    res.end();
  });
});

router.post('/eta', function(req, res) {
  var date = new Date();
  var user = req.body.user_name;
  var text = (req.body.text || '').split(' ');
  var time = parseTime(text.shift(), 'G:i');
  var reason = text.join(' ');

  if (!time) {
    res.end("You didn't say when...");
  } else {
    var diff = timeDiff(time);

    request({
      method: 'post',
      url: process.env.SLAPBOT_URL,
      json: true,
      body: {
        text: '<@' + user + '>\'s ETA is *' + time + '* ' +
          '(in ' + timeDiffFormat(diff) + ')' +
          (reason ? '\n>>> _' + reason + '_' : ''),
        username: 'etabot',
        icon_emoji: clockEmoji(time),
        channel: req.body.channel_id
      }
    }, function(error, response, body) {
      res.end();
    });
  }
});

module.exports = router;
