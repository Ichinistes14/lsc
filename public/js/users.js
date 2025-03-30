function makeEditable(row) {
  const cells = row.querySelectorAll("td");

  if (row.classList.contains("editing") || cells[2].textContent === "Accès insuffisant") {
    return;
  }

  row.classList.add("editing");

  const id = row.getAttribute("data-id");

  const _1 = cells[0].textContent;
  const _2 = cells[1].textContent;

  cells[0].innerHTML = `<input type="text" class="input" value="${_1}" disabled />`;
  cells[1].innerHTML = `<div class="select" style="width: 100%">
  <select style="width: 100%">
  <option value="user">Employé</option>
                        <% if (editor) { %>
                        <option value="editor2">Manageur</option>
                        <% } %> <% if (admin) { %>
                        <option value="editor">Co-Patron</option>
                        <option value="admin">Admin</option>
                        <% } %>
                        </select>
                        </div>`;
  cells[1].querySelector("select").value = _2;
  cells[2].innerHTML = `<button class="button is-primary btn-save" style="border-radius:50%;" data-id="${id}"><span class="icon is-small"><i class="fa-solid fa-floppy-disk"></i></span></button>`;

  row.querySelector(".btn-save").addEventListener("click", function () {
    row.classList.remove("editing");
    const __2 = cells[1].querySelector("select").value;

    const data = {
      _id: id,
      id: _1,
      role: __2,
    };

    fetch("/gestion/modify-user", {
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
}

document.querySelectorAll("tbody tr").forEach((row) => {
  row.addEventListener("dblclick", function () {
    makeEditable(row);
  });
});

document.querySelectorAll("#btn-del").forEach((button) => {
  button.addEventListener("click", (e) => {
    const row = e.target.closest("tr");
    const id = row.querySelector("td").textContent;

    fetch("/gestion/delete-user", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ id }),
    })
      .then((response) => response.json())
      .then(() => {
        window.location.reload();
      })
      .catch((error) => console.error("Erreur réseau :", error));
  });
});

document.getElementById("addRowForm").addEventListener("submit", function (e) {
  e.preventDefault();

  const id =
    e.target.id.value +
    `_${Math.floor(1000 + Math.random() * 9000).toString()}`;
  const role = e.target.role.value;

  const data = {
    id: id,
    role: role,
  };

  fetch("/gestion/add-user", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  })
    .then((response) => response.json())
    .then(() => {
      window.location.reload();
    })
    .catch((error) => {
      console.error(error);
    });
});
