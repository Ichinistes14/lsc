const searchbar = document.getElementById("search-bar");

if (searchbar) {
  searchbar.addEventListener("input", function () {
    let searchValue = this.value.toLowerCase();
    let rows = document.querySelectorAll("tbody tr");

    rows.forEach(function (row) {
      let employeeName = row.querySelector("td").textContent.toLowerCase();

      if (employeeName.includes(searchValue)) {
        row.style.display = "";
      } else {
        row.style.display = "none";
      }
    });
  });
}

document.querySelectorAll("tbody tr").forEach((row) => {
  row.addEventListener("dblclick", function () {
    makeEditable(row);
  });
});

document.querySelectorAll("#btn-del").forEach((btn) => {
  btn.addEventListener("click", (e) => {
    const id = e.target.closest("#btn-del").getAttribute("data-id");

    fetch("/delete-tombola", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ id: id }),
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.success) {
          e.target.closest("tr").remove();
        }
      });
  });
});

document.getElementById("addRowForm").addEventListener("submit", function (e) {
  e.preventDefault();

  const employe = e.target.employe.value;
  const name = e.target.name.value;
  const nombre = e.target.nombre.value;
  const phone = e.target.phone.value;

  const data = {
    employe: employe,
    name: name,
    nombre: nombre,
    phone: phone,
  };

  fetch("/add-tombola", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  })
    .then((response) => response.json())
    .then((data) => {
      if (data.success) {
        window.location.reload();
      }
    })
    .catch((error) => {
      console.error(error);
    });
});