const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

let gradeHierarchy = [];

// GRADE

async function refreshGrades() {
  const grade = await getGrades();

  gradeHierarchy = [];

  grade.forEach((grade) => {
    gradeHierarchy.push(grade.name);
  });
}

async function getGrades() {
  const { data: grade, error } = await supabase
    .from("grade")
    .select("*")
    .order("order", { ascending: true });

  if (error) {
    console.error("Erreur lors de la récupération des grade:", error);
    return [];
  }
  return grade;
}

async function addGrade(name) {
  const { data: maxOrderGrade, error: maxOrderError } = await supabase
    .from("grade")
    .select("order")
    .order("order", { ascending: false })
    .limit(1)
    .single();

  if (maxOrderError) {
    console.error(
      "Erreur lors de la récupération de l'ordre maximal:",
      maxOrderError
    );
    return;
  }

  const maxOrder = maxOrderGrade ? maxOrderGrade.order : 0;
  const { error: insertError } = await supabase
    .from("grade")
    .insert([{ name, order: maxOrder + 1 }]);

  if (insertError) {
    console.error("Erreur lors de l'ajout du grade:", insertError);
    return;
  }

  await refreshGrades();
}

async function modifyGrade(id, updates) {
  const { error: updateError } = await supabase
    .from("grade")
    .update(updates)
    .eq("_id", id);

  if (updateError) {
    console.error("Erreur lors de la modification du grade:", updateError);
    return;
  }

  await refreshGrades();
}

async function deleteGrade(id) {
  const { error: deleteError } = await supabase
    .from("grade")
    .delete()
    .eq("_id", id);

  if (deleteError) {
    console.error("Erreur lors de la suppression du grade:", deleteError);
    return;
  }

  await refreshGrades();
}

// facture

async function getFactures() {
  const { data: facture, error } = await supabase.from("facture").select("*");
  if (error) {
    console.error("Erreur lors de la récupération des facture:", error);
    return [];
  }
  return facture;
}

async function getEmployeFactures(name) {
  const { data: facture, error } = await supabase
    .from("facture")
    .select("*")
    .eq("name", name);
  if (error) {
    console.error(
      "Erreur lors de la récupération des facture de l'employé:",
      error
    );
    return [];
  }
  return facture;
}

async function addFacture(
  auteur,
  name,
  montant,
  type,
  contrat,
  gagnant,
  date = new Date()
) {
  const formattedDate = `${String(date.getDate()).padStart(2, "0")}/${String(
    date.getMonth() + 1
  ).padStart(2, "0")}/${date.getFullYear()}`;
  const { data: facture, error } = await supabase
    .from("facture")
    .insert([{ auteur, name, montant, type, contrat, gagnant, date: formattedDate }])
    .select()
    .single();

  if (error) {
    console.error("Erreur lors de l'ajout de la facture:", error);
    return;
  }

  if (gagnant) {
    await updateGagnantMontant(gagnant, -1);
  }

  return facture;
}

async function modifyFacture(id, updates) {
  const { data: oldFacture, error: findError } = await supabase
    .from("facture")
    .select("*")
    .eq("_id", id)
    .single();

  if (findError || !oldFacture) {
    console.error("Facture non trouvée.");
    return;
  }

  let extraHistory = [];
  if (oldFacture.extra) {
    try {
      extraHistory = JSON.parse(oldFacture.extra);
      if (!Array.isArray(extraHistory)) {
        extraHistory = [];
      }
    } catch (err) {
      console.error("Erreur de parsing de extra:", err);
      extraHistory = [];
    }
  }

  if (extraHistory.length === 0) {
    extraHistory.push({ ...oldFacture, statut: "Original" });
  }

  const newFacture = {
    ...oldFacture,
    ...updates,
    statut: "Modifié",
  };

  extraHistory.push(newFacture);
  updates.extra = JSON.stringify(extraHistory);

  const { data: facture, error } = await supabase
    .from("facture")
    .update(updates)
    .eq("_id", id)
    .select()
    .single();

  if (error) {
    console.error("Erreur lors de la modification de la facture:", error);
    return;
  }

  if (updates.gagnant) {
    await updateGagnantMontant(updates.gagnant, -1);
  }

  return facture;
}

async function saveEmployeesMetricsBeforeDeletion() {
  try {
    const today = new Date();
    const date = `${String(
      today.getDate()
    ).padStart(2, "0")}/${String(today.getMonth() + 1).padStart(
      2,
      "0"
    )}/${today.getFullYear()}`;

    const employeesMetrics = await getEmployesWithMetrics();

    if (employeesMetrics.length > 0) {
      const { error: backupError } = await supabase
        .from("backup")
        .insert([{ date: date, employeesMetrics: employeesMetrics }]);

      if (backupError) {
        console.error(
          "Erreur lors de la sauvegarde des métriques:",
          backupError
        );
        return;
      }
    } else {
      console.log("Aucune métrique d'employé à sauvegarder.");
    }

    const { error: deleteError } = await supabase
      .from("facture")
      .delete()
      .neq("_id", null);

    if (deleteError) {
      console.error("Erreur lors de la suppression des facture:", deleteError);
    }
  } catch (error) {
    console.error("Erreur lors de la sauvegarde des métriques :", error);
  }
}

async function deleteFacture(id) {
  if (id === -1) {
    await saveEmployeesMetricsBeforeDeletion();
    return;
  }

  const { data: facture, error: findError } = await supabase
    .from("facture")
    .select("*")
    .eq("_id", id)
    .single();

  if (findError || !facture) {
    console.error("Facture non trouvée.");
    return;
  }

  if (facture.gagnant) {
    await updateGagnantMontant(facture.gagnant, 1);
  }

  const { error: deleteError } = await supabase
    .from("facture")
    .delete()
    .eq("_id", id);

  if (deleteError) {
    console.error("Erreur lors de la suppression de la facture:", deleteError);
  }
}

// employe

async function getEmployes() {
  const { data: employe, error } = await supabase.from("employe").select("*");
  if (error) {
    console.error("Erreur lors de la récupération des employés:", error);
    return [];
  }
  return employe;
}

async function getEmployesWithMetrics() {
  await refreshGrades();

  const { data: employees, error: employeeError } = await supabase
    .from("employe")
    .select("*");
  if (employeeError) {
    console.error(
      "Erreur lors de la récupération des employés:",
      employeeError
    );
    return [];
  }

  const employeesWithMetrics = await Promise.all(
    employees.map(async (employee) => {
      const { data: employeeFactures, error: factureError } = await supabase
        .from("facture")
        .select("*")
        .eq("name", employee.name);
      if (factureError) {
        console.error(
          "Erreur lors de la récupération des facture de l'employé:",
          factureError
        );
        return { ...employee, ca: 0, cae: 0, prime: 0 };
      }

      const totalCAFromFactures = employeeFactures.reduce(
        (sum, facture) => sum + parseFloat(facture.montant || 0),
        0
      );

      let baseCA = 0;

      if (["Manageur", "DRH"].includes(employee.grade)) {
        baseCA = 50000;
      } else if (["Patron", "Co-Patron"].includes(employee.grade)) {
        baseCA = 100000;
      }

      const totalCA = totalCAFromFactures + baseCA;

      const totalCAE = employeeFactures.reduce((sum, facture) => {
        if (!facture.contrat) {
          if (facture.type === "Custom") {
            return sum + parseFloat(facture.montant || 0) / 2;
          } else if (parseFloat(facture.montant || 0) >= 200) {
            return sum + parseFloat(facture.montant || 0) - 150;
          }
          return sum + parseFloat(facture.montant || 0);
        }
        return sum;
      }, 0);

      const prime = Math.min(Math.round(totalCA * 0.1), 10000);

      return {
        ...employee,
        gradeIndex: gradeHierarchy.indexOf(employee.grade),
        ca: formatCurrency(Math.round(totalCA)),
        cae: formatCurrency(Math.round(totalCAE)),
        prime: formatCurrency(prime),
      };
    })
  );

  employeesWithMetrics.sort((a, b) => a.gradeIndex - b.gradeIndex);

  return employeesWithMetrics.map((employee) => ({
    ...employee,
    ca: employee.ca,
    cae: employee.cae,
    prime: employee.prime,
  }));
}

async function addEmploye(name, grade, phone, rib, date) {
  const { data: employe, error } = await supabase
    .from("employe")
    .insert([{ name, grade, phone, rib, date: date }])
    .select()
    .single();

  if (error) {
    console.error("Erreur lors de l'ajout de l'employé:", error);
    return;
  }
  return employe;
}

async function modifyEmploye(id, updates) {
  const { data: employe, error } = await supabase
    .from("employe")
    .update(updates)
    .eq("_id", id)
    .select()
    .single();

  if (error) {
    console.error("Erreur lors de la modification de l'employé:", error);
    return;
  }
  return employe;
}

async function deleteEmploye(id) {
  const { data: employe, error: findError } = await supabase
    .from("employe")
    .select("*")
    .eq("_id", id)
    .single();
  const { data, error } = await supabase.rpc("delete_employe_and_user", {
    employe_id: id,
  });

  if (error) {
    console.error("Erreur lors de la suppression:", error);
    return;
  }

  return employe;
}

// contrat

async function getContrats() {
  const { data: contrat, error } = await supabase.from("contrat").select("*");
  if (error) {
    console.error("Erreur lors de la récupération des contrat:", error);
    return [];
  }
  return contrat;
}

async function addContrat(name, montant) {
  const { error } = await supabase.from("contrat").insert([{ name, montant }]);
  if (error) {
    console.error("Erreur lors de l'ajout du contrat:", error);
  }
}

async function deleteContrat(id) {
  const { data: result, error } = await supabase
    .from("contrat")
    .delete()
    .eq("_id", id)
    .select()
    .single();
  if (error) {
    console.error("Erreur lors de la suppression du contrat:", error);
    return;
  }
  return result;
}

// gagnant

async function getGagnants() {
  const { data: gagnant, error } = await supabase.from("gagnant").select("*");
  if (error) {
    console.error("Erreur lors de la récupération des gagnant:", error);
    return [];
  }
  return gagnant;
}

async function updateGagnantMontant(name, delta) {
  const { data: gagnant, error: findError } = await supabase
    .from("gagnant")
    .select("*")
    .eq("name", name)
    .single();

  if (findError) {
    console.error("Erreur lors de la recherche du gagnant:", findError);
    return;
  }

  if (gagnant) {
    const updatedNombre = gagnant.nombre + delta;

    if (updatedNombre <= 0) {
      const { error: deleteError } = await supabase
        .from("gagnant")
        .delete()
        .eq("_id", gagnant._id);
      if (deleteError) {
        console.error("Erreur lors de la suppression du gagnant:", deleteError);
      }
    } else {
      const { error: updateError } = await supabase
        .from("gagnant")
        .update({ nombre: updatedNombre })
        .eq("_id", gagnant._id);
      if (updateError) {
        console.error("Erreur lors de la mise à jour du gagnant:", updateError);
      }
    }
  }
}

async function addGagnant(name, montant) {
  const { data: gagnant, error: findError } = await supabase
    .from("gagnant")
    .select("*")
    .eq("name", name)
    .single();

  if (findError) {
    const { error: insertError } = await supabase
      .from("gagnant")
      .insert([{ name, nombre: Number(montant) }]);
    if (insertError) {
      console.error("Erreur lors de l'ajout du gagnant:", insertError);
    }
    return;
  }

  if (gagnant) {
    const { error: updateError } = await supabase
      .from("gagnant")
      .update({ nombre: gagnant.nombre + Number(montant) })
      .eq("_id", gagnant._id);
    if (updateError) {
      console.error("Erreur lors de la mise à jour du gagnant:", updateError);
    }
  }
}

async function deleteGagnant(id) {
  const { data: result, error } = await supabase
    .from("gagnant")
    .delete()
    .eq("_id", id)
    .select()
    .single();
  if (error) {
    console.error("Erreur lors de la suppression du gagnant:", error);
    return;
  }
  return result;
}

// HISTORIQUE

async function getHistory() {
  const { data: history, error } = await supabase
    .from("history")
    .select("*")
    .order("year", { ascending: true })
    .order("week", { ascending: true });
  if (error) {
    console.error("Erreur lors de la récupération de l'historique:", error);
    return [];
  }
  return history.map((entry) => ({
    label: `${entry.year} - ${entry.week - 1}`,
    value: entry.montant,
  }));
}

async function addHistory(week, year, montant) {
  const { error } = await supabase
    .from("history")
    .insert([{ week, year, montant }]);
  if (error) {
    console.error("Erreur lors de l'ajout à l'historique:", error);
  }
}

// TOMBOLA

async function getTombola() {
  const { data: tombola, error } = await supabase.from("tombola").select("*");
  if (error) {
    console.error("Erreur lors de la récupération de la tombola:", error);
    return [];
  }
  return tombola;
}

async function addTombola(employe, name, nombre, phone) {
  const tarif = await getTarif();
  const facture = await addFacture(employe, tarif * nombre, "Tombola", "", "");

  const { error } = await supabase
    .from("tombola")
    .insert([{ employe, name, nombre, phone, factureId: facture._id }]);

  if (error) {
    console.error("Erreur lors de l'ajout de la tombola:", error);
  }
}

async function modifyTombola(id, updates) {
  const { data: tombola, error: findError } = await supabase
    .from("tombola")
    .select("*")
    .eq("_id", id)
    .single();

  if (findError || !tombola) {
    console.error("Tombola non trouvée.");
    return;
  }

  const { error: updateError } = await supabase
    .from("tombola")
    .update(updates)
    .eq("_id", id);

  if (updateError) {
    console.error("Erreur lors de la mise à jour de la tombola:", updateError);
  }

  if (updates.employe || updates.nombre) {
    const factureUpdates = {};
    if (updates.employe) factureUpdates.name = updates.employe;
    if (updates.nombre) factureUpdates.montant = 250 * updates.nombre;

    const { error: factureUpdateError } = await supabase
      .from("facture")
      .update(factureUpdates)
      .eq("id", tombola.factureId);

    if (factureUpdateError) {
      console.error(
        "Erreur lors de la mise à jour de la facture de la tombola:",
        factureUpdateError
      );
    }
  }
}

async function deleteTombola(id) {
  const { data: tombola, error: findError } = await supabase
    .from("tombola")
    .select("*")
    .eq("_id", id)
    .single();

  if (findError || !tombola) {
    console.error("Tombola non trouvée.");
    return;
  }

  const { error: tombolaDeleteError } = await supabase
    .from("tombola")
    .delete()
    .eq("_id", id);
  if (tombolaDeleteError) {
    console.error(
      "Erreur lors de la suppression de la tombola:",
      tombolaDeleteError
    );
  }

  const { error: factureDeleteError } = await supabase
    .from("facture")
    .delete()
    .eq("_id", tombola.factureId);
  if (factureDeleteError) {
    console.error(
      "Erreur lors de la suppression de la facture de la tombola:",
      factureDeleteError
    );
  }
}

async function getTarif() {
  const { data: tombola, error } = await supabase
    .from("tombola")
    .select("isTarif")
    .not("isTarif", "is", null)
    .single();

  if (error) {
    console.error("Erreur lors de la récupération du tarif:", error);
    return 0;
  }
  return tombola ? tombola.isTarif : 0;
}

async function modifyTarif(tarif) {
  const { error } = await supabase
    .from("tombola")
    .update({ isTarif: tarif })
    .not("isTarif", "is", null);

  if (error) {
    console.error("Erreur lors de la modification du tarif:", error);
  }
}

async function deleteAllTombola() {
  const { error } = await supabase
    .from("tombola")
    .delete()
    .eq("isDeletable", true);
  if (error) {
    console.error(
      "Erreur lors de la suppression de toutes les tombolas:",
      error
    );
  }
}

// BACKUP

async function getBackup(date) {
  if (date) {
    const { data: backup, error } = await supabase
      .from("backup")
      .select("*")
      .eq("date", date)
      .single();
    if (error) {
      console.error("Erreur lors de la récupération de la sauvegarde:", error);
      return;
    }
    return backup;
  }
  const { data: backup, error } = await supabase
    .from("backup")
    .select("*")
    .order("date", { ascending: false });
  if (error) {
    console.error("Erreur lors de la récupération des sauvegardes:", error);
    return [];
  }
  return backup;
}

// AUTRES

async function sortEmploye() {
  const { data: employees, error } = await supabase.from("employe").select("*");
  if (error) {
    console.error("Erreur lors du tri des employés:", error);
    return [];
  }
  employees.sort((a, b) => {
    const gradeAIndex = gradeHierarchy.indexOf(a.grade);
    const gradeBIndex = gradeHierarchy.indexOf(b.grade);
    return gradeAIndex - gradeBIndex;
  });
  return employees;
}

function formatCurrency(amount) {
  return `$${amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ")}`;
}

async function caTotal() {
  let caTotal = 0;

  const { data: factures, error: factureError } = await supabase
    .from("facture")
    .select("montant");

  if (factureError) {
    console.error("Erreur lors de la récupération des factures:", factureError);
    return 0;
  }

  caTotal = factures.reduce(
    (sum, facture) => sum + parseFloat(facture.montant || 0),
    0
  );

  return caTotal;
}

async function primeTotal() {
  let primeTotal = 0;

  const { data: employees, error: employeeError } = await supabase
    .from("employe")
    .select("*");
  if (employeeError) {
    console.error(
      "Erreur lors de la récupération des employés:",
      employeeError
    );
    return 0;
  }

  await Promise.all(
    employees.map(async (employee) => {
      const { data: employeeFactures, error: factureError } = await supabase
        .from("facture")
        .select("montant")
        .eq("name", employee.name);

      if (factureError) {
        console.error(
          "Erreur lors de la récupération des facture de l'employé:",
          factureError
        );
        return;
      }

      const totalCAFromFactures = employeeFactures.reduce(
        (sum, facture) => sum + parseFloat(facture.montant || 0),
        0
      );

      let baseCA = 0;

      if (["Manageur", "DRH"].includes(employee.grade)) {
        baseCA = 50000;
      } else if (["Patron", "Co-Patron"].includes(employee.grade)) {
        baseCA = 100000;
      }

      const totalCA = totalCAFromFactures + baseCA;

      const prime = Math.min(Math.round(totalCA * 0.1), 10000);

      primeTotal += prime;
    })
  );

  return primeTotal;
}

async function caEntreprise() {
  let caeTotal = 0;

  const { data: factures, error: factureError } = await supabase
    .from("facture")
    .select("montant, contrat, gagnant, type");

  if (factureError) {
    console.error("Erreur lors de la récupération des factures:", factureError);
    return 0;
  }

  caeTotal = factures.reduce((sum, facture) => {
    if (!facture.contrat || !facture.gagnant) {
      if (facture.type === "Custom") {
        return sum + parseFloat(facture.montant || 0) / 2;
      } else if (parseFloat(facture.montant || 0) >= 200) {
        return sum + parseFloat(facture.montant || 0) - 150;
      }
      return sum + parseFloat(facture.montant || 0);
    }
    return sum;
  }, 0);

  return caeTotal;
}

async function nbEmployes() {
  const { count, error } = await supabase
    .from("employe")
    .select("*", { count: "exact" });
  if (error) {
    console.error("Erreur lors du comptage des employés:", error);
    return 0;
  }
  return count;
}

async function generateMetrics() {
  const ca = await caTotal();
  const prime = await primeTotal();
  const caEnt = await caEntreprise();
  const nbEmp = await nbEmployes();

  return {
    c_a: {
      v: formatCurrency(ca),
      t: "Chiffre d'affaires",
    },
    c_a_e: {
      v: formatCurrency(Math.round(caEnt)),
      t: "Chiffre de l'entreprise",
    },
    prime: {
      v: formatCurrency(Math.round(prime)),
      t: "Prime totale",
    },
    nb: {
      v: nbEmp,
      t: "Nombre d'employés",
    },
  };
}

module.exports = {
  supabase,
  getGrades,
  addGrade,
  modifyGrade,
  deleteGrade,
  refreshGrades,
  getFactures,
  getEmployeFactures,
  addFacture,
  modifyFacture,
  deleteFacture,
  getEmployes,
  getEmployesWithMetrics,
  addEmploye,
  modifyEmploye,
  deleteEmploye,
  getContrats,
  addContrat,
  deleteContrat,
  getHistory,
  addHistory,
  sortEmploye,
  getGagnants,
  addGagnant,
  getTombola,
  addTombola,
  modifyTombola,
  deleteTombola,
  getTarif,
  modifyTarif,
  deleteAllTombola,
  deleteGagnant,
  getBackup,
  generateMetrics,
  saveEmployeesMetricsBeforeDeletion,
};
