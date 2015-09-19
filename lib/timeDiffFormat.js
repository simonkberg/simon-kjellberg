function plural (text, no) {
  if (no > 1) {
    return text + 's'
  }

  return text
}

export default (diff = { hh: 0, mm: 0 }) => {
  let str = ''

  if (diff.hh > 0) {
    str += diff.hh + ' ' + plural('hour', diff.hh)
  }

  if (diff.mm > 0 || diff.hh === 0) {
    str += (str ? ' and ' : '') + diff.mm + ' ' + plural('min', diff.mm)
  }

  return str
}
