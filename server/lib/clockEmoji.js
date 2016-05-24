
module.exports = function clockEmoji (time) {
  var hour = parseInt(time.format('h'), 10)
  var min = 30 * Math.round(time.format('m') / 30)

  if (min === 60) {
    min = 0
    hour = hour === 12 ? 1 : hour + 1
  }

  return `:clock${hour}${min || ''}:`
}
