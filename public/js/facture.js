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

function makeEditable(row) {
  if (row.classList.contains("editing")) {
    return;
  }

  row.classList.add("editing");

  const cells = row.querySelectorAll("td");
  const id = row.getAttribute("data-id");

  const _1 = cells[0].textContent;
  const _2 = cells[1].textContent;
  const _3 = cells[2].textContent;
  const _4 = cells[3].textContent;
  const _5 = cells[4].textContent;
  const _6 = cells[5].textContent;

  cells[0].innerHTML = `<input type="text" class="form-control" value="${_1}" disabled />`;
  cells[1].innerHTML = `<select
                  class="form-select"
                  id="type"
                  aria-label="Choisir le type"
                >
                  <option value="Réparation" selected>Réparation</option>
                  <option value="Bidon">Bidon</option>
                  <option value="Réparation + Bidon">Réparation + Bidon</option>
                  <option value="Custom">Custom</option>
                  <option value="Dépannage">Dépannage</option>
                </select>`;
  cells[2].innerHTML = `<input type="text" class="form-control" value="${_3}" />`;
  cells[3].innerHTML = `<input type="text" class="form-control" value="${_4}" />`;
  cells[4].innerHTML = `<input type="text" class="form-control" value="${_5}" />`;
  cells[5].innerHTML = `<input type="text" class="form-control" value="${_6}" disabled />`;
  cells[6].innerHTML = `<button class="btn btn-primary btn-floating btn-save"><i class="fa-solid fa-floppy-disk"></i></button>`;

  cells[1].querySelector("select").value = _2;

  row.querySelector(".btn-save").addEventListener("click", function () {
    row.classList.remove("editing");
    const _1 = cells[0].querySelector("input").value;
    const _2 = cells[1].querySelector("select").value;
    const _3 = cells[2].querySelector("input").value;
    const _4 = cells[3].querySelector("input").value;
    const _5 = cells[4].querySelector("input").value;
    const _6 = cells[5].querySelector("input").value;

    const data = {
      id: id,
      type: _2,
      montant: _3.replace("$", ""),
      contrat: _4,
      gagnant: _5,
      date: _6,
    };

    fetch("/modify-facture", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.success) {
          cells[0].textContent = _1;
          cells[1].textContent = _2;
          cells[2].textContent = _3;
          cells[3].textContent = _4;
          cells[4].textContent = _5;
          cells[5].textContent = _6;
          cells[6].innerHTML = `<button id="btn-del" class="btn btn-danger btn-floating" data-id="${id}"><i class="fa-solid fa-xmark"></i></button>`;
        }
      })
      .catch((error) => {
        console.error(error);
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

    fetch("/delete-facture", {
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
