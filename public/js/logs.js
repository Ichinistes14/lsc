document.getElementById("search-bar").addEventListener("input", function () {
  let searchValue = this.value.toLowerCase();
  let rows = document.querySelectorAll("tbody tr");

  rows.forEach(function (row) {
    if (row.classList.contains("editing")) return;

    let cells = row.querySelectorAll("td");
    let found = Array.from(cells).some(function (cell) {
      return cell.textContent.toLowerCase().includes(searchValue);
    });

    if (found) {
      row.style.display = "";
    } else {
      row.style.display = "none";
    }
  });
});
