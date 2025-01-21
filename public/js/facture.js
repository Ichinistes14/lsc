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
  const _4 = cells[3].textContent; // Contract
  const _5 = cells[4].textContent; // Gagnant
  const _6 = cells[5].textContent;

  cells[0].innerHTML = `<input type="text" class="input" value="${_1}" disabled />`;
  cells[1].innerHTML = `<div class="select"><select id="type" aria-label="Choisir le type" >
                  <option value="Réparation" selected>Réparation</option>
                  <option value="Bidon">Bidon</option>
                  <option value="Réparation + Bidon">Réparation + Bidon</option>
                  <option value="Custom">Custom</option>
                  <option value="Dépannage">Dépannage</option>
                </select></div>`;
  cells[2].innerHTML = `<input type="text" class="input" value="${_3}" />`;

  let selectHTML1 = `<div class="select"><select><option value="" selected>Aucun</option>`;
  let selectHTML2 = `<div class="select"><select><option value="" selected>Aucun</option>`;

  contrats.forEach((contrat) => {
    if (contrat === _4) {
      selectHTML1 += `<option value="${contrat}" selected>${contrat}</option>`;
    } else {
      selectHTML1 += `<option value="${contrat}">${contrat}</option>`;
    }
  });
  selectHTML1 += `</select></div>`;
  gagnants.forEach((gagnant) => {
    if (gagnant === _5) {
      selectHTML2 += `<option value="${gagnant}" selected>${gagnant}</option>`;
    } else {
      selectHTML2 += `<option value="${gagnant}">${gagnant}</option>`;
    }
  });
  selectHTML2 += `</select></div>`;

  cells[3].innerHTML = selectHTML1;
  cells[4].innerHTML = selectHTML2;
  cells[5].innerHTML = `<input type="text" class="input" value="${_6}" disabled />`;
  cells[6].innerHTML = `<button class="button is-primary btn-save" style="border-radius:50%;"><span class="icon is-small"><i class="fa-solid fa-floppy-disk"></i></span></button>`;

  cells[1].querySelector("select").value = _2;

  row.querySelector(".btn-save").addEventListener("click", function () {
    row.classList.remove("editing");
    const __1 = cells[0].querySelector("input").value;
    const __2 = cells[1].querySelector("select").value;
    const __3 = cells[2].querySelector("input").value;
    const __4 = cells[3].querySelector("input").value;
    const __5 = cells[4].querySelector("input").value;
    const __6 = cells[5].querySelector("input").value;

    const data = {
      id: id,
      type: __2,
      montant: __3.replace("$", ""),
      contrat: __4,
      gagnant: __5,
      date: __6,
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
          cells[0].textContent = __1;
          cells[1].textContent = __2;
          cells[2].textContent = __3;
          cells[3].textContent = __4;
          cells[4].textContent = __5;
          cells[5].textContent = __6;
          cells[6].innerHTML = `<button id="btn-del" class="button is-danger" style="border-radius: 50%;" data-id="${id}"><span class="icon is-small"><i class="fa-solid fa-xmark"></i></span></button>`;
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
