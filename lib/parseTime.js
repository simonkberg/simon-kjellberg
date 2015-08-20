// http://stackoverflow.com/a/14787410/256772
// https://gist.github.com/claviska/4744736

module.exports = function parseTime(time, format, step) {

  var hour, minute, stepMinute,
    defaultFormat = 'g:ia',
    pm = time.match(/p/i) !== null,
    num = time.replace(/[^0-9]/g, '');

  // Parse for hour and minute
  switch (num.length) {
    case 4:
      hour = parseInt(num[0] + num[1], 10);
      minute = parseInt(num[2] + num[3], 10);
      break;
    case 3:
      hour = parseInt(num[0], 10);
      minute = parseInt(num[1] + num[2], 10);
      break;
    case 2:
    case 1:
      hour = parseInt(num[0] + (num[1] || ''), 10);
      minute = 0;
      break;
    default:
      return '';
  }

  // Make sure hour is in 24 hour format
  if (pm === true && hour > 0 && hour < 12) hour += 12;

  // Force pm for hours between 13:00 and 23:00
  if (hour >= 13 && hour <= 23) pm = true;

  // Handle step
  if (step) {
    // Step to the nearest hour requires 60, not 0
    if (step === 0) step = 60;
    // Round to nearest step
    stepMinute = (Math.round(minute / step) * step) % 60;
    // Do we need to round the hour up?
    if (stepMinute === 0 && minute >= 30) {
      hour++;
      // Do we need to switch am/pm?
      if (hour === 12 || hour === 24) pm = !pm;
    }
    minute = stepMinute;
  }

  // Keep within range
  if (hour <= 0 || hour >= 24) hour = 0;
  if (minute < 0 || minute > 59) minute = 0;

  // Format output
  return (format || defaultFormat)
    // 12 hour without leading 0
    .replace(/g/g, hour === 0 ? '12' : 'g')
    .replace(/g/g, hour > 12 ? hour - 12 : hour)
    // 24 hour without leading 0
    .replace(/G/g, hour)
    // 12 hour with leading 0
    .replace(/h/g, hour.toString().length > 1 ? (hour > 12 ? hour - 12 : hour) : '0' + (hour > 12 ? hour - 12 : hour))
    // 24 hour with leading 0
    .replace(/H/g, hour.toString().length > 1 ? hour : '0' + hour)
    // minutes with leading zero
    .replace(/i/g, minute.toString().length > 1 ? minute : '0' + minute)
    // simulate seconds
    .replace(/s/g, '00')
    // lowercase am/pm
    .replace(/a/g, pm ? 'pm' : 'am')
    // lowercase am/pm
    .replace(/A/g, pm ? 'PM' : 'AM');

};
