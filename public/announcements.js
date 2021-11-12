export function getAnnouncements() {
  fetch("/announcements")
    .then((response) => response.json())
    .then((payload) => {
      const el = document.querySelector("#announcement-container");
      el.innerHTML = "";

      payload.filter(p => showAnnouncement(p)).forEach(message => {
        const announcementEl = document.createElement("div");
        announcementEl.classList.add('announcement');

        const titleEl = document.createElement("div");
        titleEl.classList.add('announcement-title');
        titleEl.innerHTML = message.title;
        announcementEl.appendChild(titleEl);

        const messageEl = document.createElement("div");
        messageEl.classList.add('announcement-content');
        messageEl.innerHTML = message.content.replaceAll('\n', '<br />');
        announcementEl.appendChild(messageEl);

        el.appendChild(announcementEl);
      });
    });
}

function showAnnouncement(announcement) {
  // only show announcements that are enabled
  if (!announcement.enabled) {
    return false
  }

  // Check to see if enabled for today
  const today = moment().format('dddd').toLowerCase();
  if (!announcement[today]) {
    return false
  }

  // if no start time, then always show
  if (announcement.start_hour === undefined) {
    return true
  }

  // when times are set, only show if within interval
  const now = moment()
  const currentHour = now.hour()
  return currentHour >= announcement.start_hour && currentHour < announcement.end_hour
}


