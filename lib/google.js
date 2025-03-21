const Facture = require("../models/Facture");
const Employe = require("../models/Employe");
const Contrat = require("../models/Contrat");
const Gagnant = require("../models/Gagnant");
const History = require("../models/History");
const Tombola = require("../models/Tombola");
const Grade = require("../models/Grade");
const Backup = require("../models/Backup");

var gradeHierarchy = [];

// GRADE

async function refreshGrades() {
  const grades = await getGrades();

  gradeHierarchy = [];

  grades.forEach((grade) => {
    gradeHierarchy.push(grade.name);
  });
}

async function getGrades() {
  const grades = await Grade.find().sort({ order: 1 });

  return grades;
}

async function addGrade(name) {
  const maxOrderGrade = await Grade.findOne().sort("-order").exec();
  const maxOrder = maxOrderGrade ? maxOrderGrade.order : 0;
  const grade = new Grade({ name, order: maxOrder + 1 });
  await grade.save();

  await refreshGrades();
}

async function modifyGrade(id, updates) {
  const grade = await Grade.findByIdAndUpdate(id, updates);
  if (!grade) {
    console.error("Grade non trouvé.");
    return;
  }

  await refreshGrades();
}

async function deleteGrade(id) {
  const result = await Grade.findByIdAndDelete(id);
  if (!result) {
    console.error("Grade non trouvé.");
    return;
  }

  await refreshGrades();
}

// FACTURES

async function getFactures() {
  const factures = await Facture.find();
  return factures;
}

async function getEmployeFactures(name) {
  const factures = await Facture.find({ name });
  return factures;
}

async function addFacture(
  name,
  montant,
  type,
  contrat,
  gagnant,
  date = new Date()
) {
  let formattedDate =
    ("0" + date.getDate()).slice(-2) +
    "/" +
    ("0" + (date.getMonth() + 1)).slice(-2) +
    "/" +
    date.getFullYear() +
    " " +
    ("0" + date.getHours()).slice(-2) +
    ":" +
    ("0" + date.getMinutes()).slice(-2) +
    ":" +
    ("0" + date.getSeconds()).slice(-2);
  const facture = new Facture({
    name,
    montant,
    type,
    contrat,
    gagnant,
    date: formattedDate,
  });
  await facture.save();

  if (gagnant) {
    await updateGagnantMontant(gagnant, -1);
  }

  return facture;
}

async function modifyFacture(id, updates) {
  const facture = await Facture.findByIdAndUpdate(id, updates, { new: true });
  if (!facture) {
    console.error("Facture non trouvée.");
    return;
  }

  if (updates.gagnant) {
    await updateGagnantMontant(updates.gagnant, -1);
  }
}

async function saveEmployeesMetricsBeforeDeletion() {
  try {
      const today = new Date();
      const date = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${today.getDate()}`;

      const employeesMetrics = await getEmployesWithMetrics();

      if (employeesMetrics.length > 0) {
          await Backup.create({
              date: date,
              employeesMetrics: employeesMetrics
          });
      } else {
          console.log("Aucune métrique d'employé à sauvegarder.");
      }

      await Facture.deleteMany();
  } catch (error) {
      console.error("Erreur lors de la sauvegarde des métriques :", error);
  }
}

async function deleteFacture(id) {
  if (id === -1) {
    await saveEmployeesMetricsBeforeDeletion();
    return;
  }

  const facture = await Facture.findById(id);
  if (!facture) {
    console.error("Facture non trouvée.");
    return;
  }

  if (facture.gagnant) {
    await updateGagnantMontant(facture.gagnant, 1);
  }

  await Facture.findByIdAndDelete(id);
}

// EMPLOYES

async function getEmployes() {
  const employes = await Employe.find();
  return employes;
}

async function getEmployesWithMetrics() {
  await refreshGrades();

  const employees = await Employe.find();
  const employeesWithMetrics = await Promise.all(
    employees.map(async (employee) => {
      const employeeFactures = await Facture.find({ name: employee.name });
      const totalCAFromFactures = employeeFactures.reduce(
        (sum, facture) => sum + parseFloat(facture.montant || 0),
        0
      );

      let baseCA = 0;

      if (
        ["Manageur", "DRH", "Comptable", "Secrétaire"].includes(employee.grade)
      ) {
        baseCA = 50000;
        basePrime = 5000;
      } else if (["Patron", "Co-Patron"].includes(employee.grade)) {
        baseCA = 100000;
        basePrime = 10000;
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
        ...employee.toObject(),
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

async function addEmploye(name, grade, phone, rib, date = new Date()) {
  let formattedDate;
  if (!date) {
    formattedDate =
      ("0" + date.getDate()).slice(-2) +
      "/" +
      ("0" + (date.getMonth() + 1)).slice(-2) +
      "/" +
      date.getFullYear();
  }

  const employe = new Employe({
    name,
    grade,
    phone,
    rib,
    date: date == null ? formattedDate : date,
  });
  await employe.save();
  return employe;
}

async function modifyEmploye(id, updates) {
  const employe = await Employe.findByIdAndUpdate(id, updates, { new: true });
  if (!employe) {
    console.error("Employé non trouvé.");
    return;
  }
}

async function deleteEmploye(id) {
  const result = await Employe.findByIdAndDelete(id);
  if (!result) {
    console.error("Employé non trouvé.");
    return;
  }
  return result;
}

// CONTRATS

async function getContrats() {
  const contrats = await Contrat.find();
  return contrats;
}

async function addContrat(name, montant) {
  const contrat = new Contrat({ name, montant });
  await contrat.save();
}

async function deleteContrat(id) {
  const result = await Contrat.findByIdAndDelete(id);
  if (!result) {
    console.error("Contrat non trouvé.");
    return;
  }
}

// GAGNANTS

async function getGagnants() {
  const gagnants = await Gagnant.find();
  return gagnants;
}

async function updateGagnantMontant(name, delta) {
  const gagnant = await Gagnant.findOne({ name: name });

  if (gagnant) {
    gagnant.nombre += delta;

    if (gagnant.montant <= 0) {
      await Gagnant.findByIdAndDelete(gagnant._id);
    } else {
      await gagnant.save();
    }
  }
}

async function addGagnant(name, montant) {
  const gagnant = await Gagnant.findOne({ name });
  if (gagnant) {
    gagnant.nombre += Number(montant);
    await gagnant.save();
  } else {
    const newGagnant = new Gagnant({ name, nombre: Number(montant) });
    await newGagnant.save();
  }
}

async function deleteGagnant(id) {
  const result = await Gagnant.findByIdAndDelete(id);
  if (!result) {
    console.error("Gagnant non trouvé.");
    return;
  }
}

// HISTORIQUE

async function getHistory() {
  const history = await History.find().sort({ year: 1, week: 1 });
  return history.map((entry) => ({
    label: `${entry.year} - ${entry.week - 1}`,
    value: entry.montant,
  }));
}

async function addHistory(week, year, montant) {
  const history = new History({ week, year, montant });
  await history.save();
}

// TOMBOLA

async function getTombola() {
  const tombola = await Tombola.find();
  return tombola;
}

async function addTombola(employe, name, nombre, phone) {
  const tarif = await getTarif();
  const facture = await addFacture(employe, tarif * nombre, "Tombola", "", "");

  const tombola = new Tombola({
    employe,
    name,
    nombre,
    phone,
    factureId: facture._id,
  });
  await tombola.save();
}

async function modifyTombola(id, updates) {
  const tombola = await Tombola.findById(id);
  if (!tombola) {
    console.error("Tombola non trouvée.");
    return;
  }

  await Tombola.findByIdAndUpdate(id, updates);

  if (updates.employe || updates.name) {
    const factureUpdates = {};
    if (updates.employe) factureUpdates.name = updates.employe;
    if (updates.nombre) factureUpdates.montant = 250 * updates.nombre;

    await Facture.findByIdAndUpdate(tombola.factureId, factureUpdates);
  }
}

async function deleteTombola(id) {
  const tombola = await Tombola.findById(id);
  if (!tombola) {
    console.error("Tombola non trouvée.");
    return;
  }

  await Facture.findByIdAndDelete(tombola.factureId);
  await Tombola.findByIdAndDelete(id);
}

async function getTarif() {
  const tombola = await Tombola.findOne({ isTarif: { $exists: true } });
  return tombola ? tombola.isTarif : 0;
}

async function modifyTarif(tarif) {
  await Tombola.updateMany({ isTarif: { $exists: true } }, { isTarif: tarif });
}

async function deleteAllTombola() {
  await Tombola.deleteMany({ isDeletable: true });
}

// BACKUP

async function getBackup(date) {
  if (date) {
    const backup = await Backup.findOne({ date: date });
    return backup;
  }
  const backup = await Backup.find().sort({ date: -1 });
  return backup;
}

// AUTRES

async function sortEmploye() {
  const employees = await Employe.find();
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

  const employees = await Employe.find();
  await Promise.all(
    employees.map(async (employee) => {
      const employeeFactures = await Facture.find({ name: employee.name });
      const totalCAFromFactures = employeeFactures.reduce(
        (sum, facture) => sum + parseFloat(facture.montant || 0),
        0
      );

      const totalCA = totalCAFromFactures;

      caTotal += totalCA;
    })
  );

  return caTotal;
}

async function primeTotal() {
  let primeTotal = 0;

  const employees = await Employe.find();
  await Promise.all(
    employees.map(async (employee) => {
      const employeeFactures = await Facture.find({ name: employee.name });
      const totalCAFromFactures = employeeFactures.reduce(
        (sum, facture) => sum + parseFloat(facture.montant || 0),
        0
      );

      let baseCA = 0;

      if (
        ["Manageur", "DRH", "Comptable", "Secrétaire"].includes(employee.grade)
      ) {
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

  const employees = await Employe.find();
  await Promise.all(
    employees.map(async (employee) => {
      const employeeFactures = await Facture.find({ name: employee.name });

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

      caeTotal += totalCAE;
    })
  );

  return caeTotal;
}

async function nbEmployes() {
  const count = await Employe.countDocuments();
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
