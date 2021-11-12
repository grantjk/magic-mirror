export function showCartoonCharacter() {
  fetch("/pokemon")
    .then((response) => response.json())
    .then((payload) => {
      const cartoonElement = document.querySelector("#cartoon");
      cartoonElement.innerHTML = `<pre class='art'>${payload.art}</pre>`;
    });
}


