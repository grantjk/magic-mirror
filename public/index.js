import { showDate, showTime } from './datetime.js';
import { getCalendarEvents } from './calendar.js';
import { getCountdownEvents } from './countdown.js';
import { getWeather } from './weather.js';
import { getJaysSchedule } from './baseball.js';
import { getAnnouncements } from './announcements.js';
import { showPositiveMessage } from './positive-message.js';
import { showCartoonCharacter } from './cartoon.js';
import { reverseRows } from './reverser.js';

/* ============ Main ====================== */

function setup() {
  configureMoment();
}

/* Setup */
function configureMoment() {
  moment.relativeTimeThreshold("h", 48); // better than "a day for 36 hours"
  moment.relativeTimeThreshold("w", 4); // enables weeks
}

function loadAll() {
  showDate();
  //showPositiveMessage();
  showTime();
  //showCartoonCharacter();
  getCalendarEvents();
  getCountdownEvents();
  getWeather();
  getJaysSchedule();
  getAnnouncements();
}

function updateEverySecond() {
  showTime();
  showDate();
}

function updateEveryMinute() {
  getJaysSchedule(); // dynamic timing based on server
  getCalendarEvents(); // no check on server
  getCountdownEvents();
  //showPositiveMessage();
  getAnnouncements();
  getWeather(); // controlled on server side, so can request frequently
}

function updateEveryFiveMins() {
  //showCartoonCharacter();
}

function updateEveryHour() {
  reverseRows();
}


/*============MAIN=============*/
setup();
loadAll();

/* Run Loop */
// Every Second
setInterval(() => {
  updateEverySecond();
}, 1000);

// Every Minute
setInterval(() => {
  updateEveryMinute();
}, 1000 * 60); // every minute

// 5 Minute Intervals
setInterval(() => {
  updateEveryFiveMins();
}, 1000 * 60 * 60); // 5 min updates - 90 for now to get a hold on the rate limit


// Hourly Interval
setInterval(() => {
  updateEveryHour();
}, 1000 * 60 * 60); // change layout every hour to prevent burn in



