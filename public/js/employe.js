if (document.getElementById("f"))
  document.getElementById("f").reset();

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

const addFacture = document.getElementById("addFacture");

if (addFacture) {
  addFacture.addEventListener("show.bs.modal", (event) => {
    const button = event.relatedTarget;
    const r = button.getAttribute("data-bs-name");

    const modalTitle = addFacture.querySelector(".modal-title");
    modalTitle.textContent = `Ajouter une facture à ${r}`;
    document.getElementById("personName").value = r;
  });
}

const btnAddFacture = document.getElementById("btnAddFacture");

if (btnAddFacture) {
  btnAddFacture.addEventListener("click", (e) => {
    const name = document.getElementById("personName").value;
    const montant = document.getElementById("montant").value;
    const type = document.getElementById("type").value;
    const contrat = document.getElementById("contrat").value;
    const gagnant = document.getElementById("gagnant").value;

    const alertPlaceholder = document.getElementById("liveAlert");
    const appendAlert = (message, type) => {
      const wrapper = document.createElement("div");
      wrapper.innerHTML = [
        `<div class="alert alert-${type} alert-dismissible" role="alert">`,
        `   <div>${message}</div>`,
        '   <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>',
        "</div>",
      ].join("");

      alertPlaceholder.append(wrapper);
    };

    if (!montant || montant == 0) {
      return appendAlert("Aucun montant n'a été renseigné", "danger");
    }

    const data = {
      name: name,
      montant: montant,
      type: type,
      contrat: contrat,
      gagnant: gagnant,
    };

    fetch("/add-facture", {
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
        } else {
          appendAlert(
            "Une erreur est survenu lors de l'ajout de la facture",
            "danger"
          );
        }
      })
      .catch((error) => {
        console.error(error);
        appendAlert(
          "Une erreur est survenue lors de l'ajout de la facture. Merci de réessayer plus tard.",
          "danger"
        );
      });
  });
}
