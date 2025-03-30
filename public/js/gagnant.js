document.getElementById("search-bar").addEventListener("input", function () {
  let searchValue = this.value.toLowerCase();
  let rows = document.querySelectorAll("tbody tr");

  rows.forEach(function (row) {
    if (row.classList.contains("editing"))
      return;
    
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

    fetch("/gestion/delete-gagnant", {
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
  const montant = e.target.montant.value;

  const data = {
    name: name,
    montant: montant,
  };

  fetch("/gestion/add-gagnant", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  })
    .then((response) => response.json())
    .then((data) => {
      window.location.reload();
    })
    .catch((error) => {
      console.error(error);
    });
});