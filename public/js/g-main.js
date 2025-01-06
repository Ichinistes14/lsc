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
  const _7 = cells[6].textContent;
  const _8 = cells[7].textContent;

  cells[0].innerHTML = `<input type="text" class="form-control" value="${_1}" />`;

  let selectHTML = `<select class="form-select">`;
  
  grades.forEach((grade) => {
    if (grade === _2) {
      selectHTML += `<option value="${grade}" selected>${grade}</option>`;
    } else {
      selectHTML += `<option value="${grade}">${grade}</option>`;
    }
  });
  selectHTML += `</select>`;
  cells[1].innerHTML = selectHTML;
  cells[2].innerHTML = `<input type="text" class="form-control" value="${_3}" disabled />`;
  cells[3].innerHTML = `<input type="text" class="form-control" value="${_4}" disabled />`;
  cells[4].innerHTML = `<input type="text" class="form-control" value="${_5}" disabled />`;
  cells[5].innerHTML = `<input type="text" class="form-control" value="${_6}" />`;
  cells[6].innerHTML = `<input type="text" class="form-control" value="${_7}" />`;
  cells[7].innerHTML = `<input type="text" class="form-control" value="${_8}" disabled />`;
  cells[8].innerHTML = `<button class="btn btn-primary btn-floating btn-save" data-id="${id}"><i class="fa-solid fa-floppy-disk"></i></button>`;

  row.querySelector(".btn-save").addEventListener("click", function () {
    row.classList.remove("editing");
    const __1 = cells[0].querySelector("input").value;
    const __2 = cells[1].querySelector("select").value;
    const __6 = cells[5].querySelector("input").value;
    const __7 = cells[6].querySelector("input").value;
    const __8 = cells[7].querySelector("input").value;

    const data = {
      id: id,
      name: __1,
      grade: __2,
      date: __8,
      rib: __7,
      phone: __6,
    };

    fetch("/gestion/modify-employe", {
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
          cells[6].textContent = _7;
          cells[7].textContent = _8;
          cells[8].innerHTML = `<button id="btn-del" class="btn btn-danger btn-floating" data-id="${id}"><i class="fa-solid fa-xmark"></i></button>`;
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

document.getElementById("addRowForm").addEventListener("submit", function (e) {
  e.preventDefault();

  const name = e.target.name.value;
  const grade = e.target.grade.value;
  const revenue = e.target.revenue.value;
  const companyRevenue = e.target.companyRevenue.value;
  const bonus = e.target.bonus.value;
  const phone = e.target.phone.value;
  const rib = e.target.rib.value;
  const date = e.target.date.value;

  const data = {
    name: name,
    grade: grade,
    revenue: revenue,
    companyRevenue: companyRevenue,
    bonus: bonus,
    phone: phone,
    rib: rib,
    date: date,
  };

  fetch("/gestion/add-employe", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  })
    .then((response) => response.json())
    .then((data) => {
      if (data.success) {
        const tbody = document.querySelector("tbody");
        const newRow = `
          <tr class="align-middle">
            <td>${name}</td>
            <td>${grade}</td>
            <td>${revenue}</td>
            <td>${companyRevenue}</td>
            <td>${bonus}</td>
            <td>${phone}</td>
            <td>${rib}</td>
            <td>${date}</td>
            <td><button id="btn-del" class="btn btn-danger btn-floating"><i class="fa-solid fa-xmark"></i></button></td>
          </tr>`;

        tbody.insertAdjacentHTML("beforeend", newRow);
        e.target.reset();
      }
    })
    .catch((error) => {
      console.error(error);
    });

  tbody.insertAdjacentHTML("beforeend", newRow);
  e.target.reset();
});

document.querySelectorAll("#btn-del").forEach((b) => {
  b.addEventListener("click", (e) => {
    const row = e.target.closest("tr");
    const id = row.getAttribute("data-id");

    fetch("/gestion/delete-employe", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ id }),
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.success) {
          row.remove();
        } else {
          console.error("Échec de la suppression :", data.message);
        }
      })
      .catch((error) => console.error("Erreur réseau :", error));
  });
});

const delFacture = document.getElementById("delFacture");
if (delFacture) {
  delFacture.addEventListener("click", (e) => {
    fetch("/gestion/delete-facture", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ row: -1 }),
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
