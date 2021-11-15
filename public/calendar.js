import { eventIsOver, isEventToday, isEventTomorrow } from './event-helpers.js';

export function getCalendarEvents() {
  fetch("/events")
    .then((response) => response.json())
    .then((payload) => {
      // Today's Events
      const todaysEvents = payload.filter((e) => !eventIsOver(e) && isEventToday(e));
      const todayList = buildCalendarListItemsFromEvents(todaysEvents);
      const calendarElement = document.querySelector("#event-list");
      calendarElement.innerHTML = "";
      calendarElement.appendChild(todayList);

      // Tomorrow's Events
      const tomorrowsEvents = payload.filter((e) =>{
        return isEventTomorrow(e)
      });
      const tomorrowList = buildCalendarListItemsFromEvents(tomorrowsEvents);
      const tomorrowElement = document.querySelector("#event-list-tomorrow");
      tomorrowElement.innerHTML = "";

      if (tomorrowsEvents.length > 0 && moment().hour() >= 20) {
        const tomorrowHeader = document.createElement('div');
        tomorrowHeader.innerText = 'Tomorrow';
        tomorrowHeader.classList.add('text-3');
        tomorrowHeader.classList.add('mt40');
        tomorrowElement.appendChild(tomorrowHeader);
        tomorrowElement.appendChild(tomorrowList);
      }

      const emptyCalendar = document.getElementById('empty-calendar')
      if (todaysEvents.length == 0 && tomorrowsEvents.length === 0) {
        emptyCalendar.classList.remove('hidden')
      } else {
        emptyCalendar.classList.add('hidden')
      }
    });
}

function buildCalendarListItemsFromEvents(events) {
  const listElement = document.createElement("ul");
  events.forEach((event) => {
    const itemElement = document.createElement("li");
    itemElement.classList.add("calendar-event");
    listElement.appendChild(itemElement);

    if (event.allDay) {
      itemElement.classList.add('row');
      const eventName = document.createElement("div");
      eventName.classList.add("event-name-all-day");
      eventName.textContent = event.title;

      const spacer = document.createElement('div');
      itemElement.appendChild(spacer);
      itemElement.appendChild(eventName);
    } else {
      const timeRow = document.createElement('div');
      timeRow.classList.add('calendar-time-row');
      timeRow.textContent = `${event.start.time} - ${event.end.time}`
      itemElement.appendChild(timeRow);

      const eventName = document.createElement("div");
      eventName.classList.add("event-name");
      eventName.textContent = event.title;
      itemElement.appendChild(eventName);
    }

  });
  return listElement;
}

