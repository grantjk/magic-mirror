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

    return (
      start.isBefore(now) &&
      !moment(end.format("YYYY-MM-DD")).isSame(now, "day")
    );
  }

  const start = moment(event.start.raw);
  const end = moment(event.end.raw);
  const now = moment();
  return start.isBefore(now) && end.isBefore(now);
}

export function isEventToday(event) {
  const startDate = moment(moment.utc(event.start.raw).format("YYYY-MM-DD"))
  return startDate.isSame(moment(), "day");
}

export function isEventTomorrow(event) {
  const startDate = moment(moment.utc(event.start.raw).format("YYYY-MM-DD"))
  return startDate.isSame(moment().add(1, 'day'), "day");
}

