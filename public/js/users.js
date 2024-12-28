function addDeleteListener(button) {
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
        .then((data) => {
          if (data.success) {
            row.remove();
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
  
    const id = e.target.id.value + `_${Math.floor(1000 + Math.random() * 9000).toString()}`;
    const role = e.target.role.value
  
    const data = {
      id: id,
      role: role
    };
  
    fetch("/gestion/add-user", {
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
                <td>${id}</td>
                <td>${role}</td>
                <td><button id="btn-del" class="btn btn-danger btn-floating"><i class="fa-solid fa-xmark"></i></button></td>
              </tr>`;
  
          tbody.insertAdjacentHTML("beforeend", newRow);
          e.target.reset();
  
          const newButton = tbody.querySelector("tr:last-child #btn-del");
          addDeleteListener(newButton);
        }
      })
      .catch((error) => {
        console.error(error);
      });
  });