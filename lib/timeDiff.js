
module.exports = function timeDiff(time) {
  var parts = time.split(':');
  var hour = parseInt(parts[0], 10);
  var min = parseInt(parts[1], 10);
  var now = new Date();
  var then = new Date().setHours(hour).setMinutes(min);

  if (then < now) {
    // next day
    then.setDate(then.getDate() + 1);
  }

  var diff = then - now;

  var hh = Math.floor(diff / 1000 / 60 / 60);
  diff -= hh * 1000 * 60 * 60;

  var mm = Math.floor(diff / 1000 / 60);
  diff -= mm * 1000 * 60;

  return {
    hh: hh,
    mm: mm
  };
};
