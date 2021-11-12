let reversed = false;
export function reverseRows() {
  const rows = document.querySelectorAll(".row");
  const columns = document.querySelectorAll(".column-reversible");
  if (reversed) {
    rows.forEach((el) => el.classList.remove("row-reverse"));
    columns.forEach((el) => el.classList.remove("reversed"));
  } else {
    rows.forEach((el) => el.classList.add("row-reverse"));
    columns.forEach((el) => el.classList.add("reversed"));
  }
  reversed = !reversed;
}

