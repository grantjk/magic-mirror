const moment = require('moment');

function isFullDayEvent(event) {
  if (event?.data?.duration?.days > 0 || event?.data?.duration?.weeks > 0) {
    return true;
  }

  const start = moment.utc(event.data.start);
  const end = moment.utc(event.data.end);
  return start.hour() === 0 && end.isSame(start.endOf("day"), "second");
}

module.exports = { isFullDayEvent };
