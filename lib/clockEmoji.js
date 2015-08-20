
module.exports = function clockEmoji(time) {
  var parts = time.split(':');
  var hour = parseInt(parts[0], 10);

  if (hour > 12 || hour === 0) {
    hour = Math.abs(hour - 12);
  }

  var min = 30 * Math.round(parts[1] / 30);

  return ':clock' + hour + (min || '') + ':';
};
