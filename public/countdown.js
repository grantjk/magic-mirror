import { numberOfDaysToEvent } from './event-helpers.js';

export function getCountdownEvents() {
  fetch("/countdown")
    .then((response) => response.json())
    .then((events) => {
      const filteredEvents = events.filter( (e) => {
        return numberOfDaysToEvent(e) > 0;
      }).slice(0,5);

      // Add title
      const title = filteredEvents.length > 0 ? "How many sleeps until..." : "";
      const titleEl = document.querySelector('#countdown-title');
      titleEl.textContent = title;

      const calendarElement = document.querySelector("#countdown-list");

      // Add list items
      const listElement = document.createElement("ul");
      filteredEvents.forEach((event) => {
        const itemElement = document.createElement("li");
        itemElement.classList.add("countdown-event");
        listElement.appendChild(itemElement);

        itemElement.classList.add('row');
        const eventName = document.createElement("div");
        eventName.classList.add("countdown-event-name");
        eventName.textContent = event.title;

        const daysLeft = document.createElement("div");
        daysLeft.classList.add("countdown-days-left");
        daysLeft.textContent = numberOfDaysToEvent(event);

        itemElement.appendChild(eventName);
        itemElement.appendChild(daysLeft);
      });

      calendarElement.innerHTML = "";
      calendarElement.appendChild(listElement);
    });
}


