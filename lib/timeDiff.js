export default (time) => {
  let parts = time.split(':')
  let hour = parseInt(parts[0], 10)
  let min = parseInt(parts[1], 10)
  let now = new Date()
  let then = new Date()

  then.setHours(hour)
  then.setMinutes(min)

  if (then < now) {
    // next day
    then.setDate(then.getDate() + 1)
  }

  let diff = then - now

  let hh = Math.floor(diff / 1000 / 60 / 60)
  diff -= hh * 1000 * 60 * 60
  let mm = Math.floor(diff / 1000 / 60)

  return {
    hh: hh,
    mm: mm
  }
}
