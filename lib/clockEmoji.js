module.exports = function clockEmoji (time) {
  var parts = time.split(':')
  var hour = parseInt(parts[0], 10)
  var min = 30 * Math.round(parts[1] / 30)

  if (min === 60) {
    min = 0
    hour = hour === 24 ? 1 : hour + 1
  }

  if (hour > 12 || hour === 0) {
    hour = Math.abs(hour - 12)
  }

  return ':clock' + hour + (min || '') + ':'
}
