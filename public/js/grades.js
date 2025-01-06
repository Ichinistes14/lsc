document.getElementById("search-bar").addEventListener("input", function () {
  let searchValue = this.value.toLowerCase();
  let rows = document.querySelectorAll("tbody tr");

  rows.forEach(function (row) {
    if (row.classList.contains("editing")) return;

    let employeeName = row.querySelector("td").textContent.toLowerCase();

    if (employeeName.includes(searchValue)) {
      row.style.display = "";
    } else {
      row.style.display = "none";
    }
  });
});

function addDeleteListener(button) {
  button.addEventListener("click", (e) => {
    const row = e.target.closest("tr");
    const id = row.getAttribute("data-id");

    fetch("/gestion/delete-grade", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ id }),
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.success) {
          window.location.reload();
        } else {
          console.error("Échec de la suppression :", data.message);
        }
      })
      .catch((error) => console.error("Erreur réseau :", error));
  });
}

document.querySelectorAll("#btn-del").forEach((button) => {
  addDeleteListener(button);
});

document.getElementById("addRowForm").addEventListener("submit", function (e) {
  e.preventDefault();

  const name = e.target.name.value;

  const data = {
    name: name,
  };

  fetch("/gestion/add-grade", {
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

var el = document.getElementById("grades-list");
var sortable = Sortable.create(el, {
  handle: ".align-middle",
  animation: 150
});

document.getElementById("save-order").addEventListener("click", function () {
  var order = sortable
    .toArray()
    .slice(1)
    .map((id, index) => ({ id: id, order: index + 1 }));
    console.log(order);
  fetch("/gestion/order-grades", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ grades: order }),
  }).then((response) => {
    if (response.ok) {
      window.location.reload();
    }
  });
});