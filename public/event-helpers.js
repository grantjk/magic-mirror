export function numberOfDaysToEvent(event) {
  const today = moment().startOf('day');
  const start = moment(event.date);
  const days = moment.duration(start.diff(today)).asDays();
  return Math.round(days);
}

export function eventIsOver(event) {
  if (event.allDay) {
    const start = moment.utc(event.start.raw);
    const end = moment.utc(event.end.raw);
    const now = moment();

    const today = dateOnly(now);
    const eventEndDay = dateOnly(end);

    // Check for long running events over multiple days in the future
    if (start.isBefore(now) && moment(today).isBefore(moment(eventEndDay))) {
      return false
    }

    // Check for events ending today
    return (
      start.isBefore(now) &&
      !moment(eventEndDay).isSame(now, "day")
    );
  }

  const start = moment(event.start.raw);
  const end = moment(event.end.raw);
  const now = moment();
  return start.isBefore(now) && end.isBefore(now);
}

export function dateOnly(momentDate) {
  return momentDate.format("YYYY-MM-DD")
}

export function isEventToday(event) {
  const startDate = eventStartDate(event);
  const endDate = eventEndDate(event);
  const today = moment(dateOnly(moment()));

  // Check for events spanning multiple days
  if (startDate.isBefore(today) && endDate.isAfter(today)) {
    return true
  }

  // Otherwise, only check events starting today
  return startDate.isSame(moment(), "day");
}

export function isEventTomorrow(event) {
  const startDate = eventStartDate(event);
  return startDate.isSame(moment().add(1, 'day'), "day");
}

function eventStartDate(event) {
  let startDate = moment(dateOnly(moment(event.start.raw)))
  if (event.allDay) {
    startDate = moment(dateOnly(moment.utc(event.start.raw)))
  }
  return startDate
}

function eventEndDate(event) {
  let endDate = moment(dateOnly(moment(event.end.raw)))
  if (event.allDay) {
    endDate = moment(dateOnly(moment.utc(event.end.raw)))
  }
  return endDate
}
