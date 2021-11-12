export function showPositiveMessage() {
  fetch("/message")
    .then((response) => response.json())
    .then((payload) => {
      const messageElement = document.querySelector("#positiveMessage");
      messageElement.textContent = payload.message;
    });
}

