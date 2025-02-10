const express = require("express");
const crypto = require("crypto-js");

const router = express.Router();

const User = require("../models/User");
const Employe = require("../models/Employe");
const Log = require("../models/Log");
const {
  getGrades,
  addGrade,
  deleteGrade,
  addEmploye,
  modifyEmploye,
  deleteEmploye,
  addContrat,
  deleteContrat,
  deleteFacture,
  getEmployesWithMetrics,
  getContrats,
  getGagnants,
  addGagnant,
  deleteGagnant,
  modifyGrade,
  getBackup,
} = require("../lib/google");

async function logAction(action, admin) {
  var _admin = await crypto.AES.decrypt(
    admin,
    `kr:37bJOrM]q+ZD4Hvk1oT(d>0>S!/*H{O2v3)F3bNKYQ;UfseIzxh1.g"H/Y'!`
  ).toString(crypto.enc.Utf8);

  if (!_admin) {
    return console.error("Non décodé");
  }

  const log = new Log({
    action,
    admin: _admin,
  });
  await log.save();
}

const checkConnetion = async (req, res, next) => {
  if (req.cookies.id) {
    const d = crypto.AES.decrypt(
      decodeURIComponent(req.cookies.id),
      `kr:37bJOrM]q+ZD4Hvk1oT(d>0>S!/*H{O2v3)F3bNKYQ;UfseIzxh1.g"H/Y'!`
    ).toString(crypto.enc.Utf8);

    const user = await User.findOne({ id: d });

    if (
      (user && user.role === "admin") ||
      user.role === "editor" ||
      user.role === "editor2"
    ) {
      return next();
    }

    if (!isAdmin(req)) return;

    res.redirect("/");
  } else {
    res.redirect("/login");
  }
};

async function isAdmin(req) {
  const d = crypto.AES.decrypt(
    decodeURIComponent(req.cookies.id),
    `kr:37bJOrM]q+ZD4Hvk1oT(d>0>S!/*H{O2v3)F3bNKYQ;UfseIzxh1.g"H/Y'!`
  ).toString(crypto.enc.Utf8);

  const user = await User.findOne({ id: d });

  if (
    user.role === "admin" ||
    user.role === "editor" ||
    user.role === "editor2"
  ) {
    return true;
  } else {
    return false;
  }
}

/* GET */

router.get("/home", checkConnetion, async (req, res) => {
  try {
    const sheetData = await getEmployesWithMetrics();
    const grades = await getGrades();

    res.render("gestion/home", { employees: sheetData, grades });
  } catch (error) {
    console.error(error);
    res.sendStatus(500);
  }
});

router.get("/contrats", checkConnetion, async (req, res) => {
  try {
    const contrats = await getContrats();

    res.render("gestion/contrats", { contrats });
  } catch (err) {
    console.error(err);
    res.sendStatus(500);
  }
});

router.get("/gagnants", checkConnetion, async (req, res) => {
  try {
    const gagnants = await getGagnants();

    res.render("gestion/gagnants", { gagnants });
  } catch (err) {
    console.error(err);
    res.sendStatus(500);
  }
});

router.get("/grades", checkConnetion, async (req, res) => {
  try {
    const grades = await getGrades();

    res.render("gestion/grades", { grades });
  } catch (err) {
    console.error(err);
    res.sendStatus(500);
  }
});

router.get("/history", checkConnetion, async (req, res) => {
  try {
    const backup = await getBackup();

    res.render("gestion/history", { backup });
  } catch (err) {
    console.error(err);
    res.sendStatus(500);
  }
});

router.get("/history/:date", checkConnetion, async (req, res) => {
  try {
    const dateParam = new Date(req.params.date);

    const date = `${dateParam.getFullYear()}-${String(dateParam.getMonth() + 1).padStart(2, "0")}-${dateParam.getDate()}`;
    
    const backup = await getBackup(date);

    res.render("gestion/historyDate", { employees: backup ? backup.employeesMetrics : [], date: req.params.date });
  } catch (err) {
    console.error(err);
    res.sendStatus(500);
  }
});

router.get("/logs", checkConnetion, async (req, res) => {
  try {
    const logs = await Log.find().sort({ timestamp: -1 });
    const u = await crypto.AES.decrypt(
      decodeURIComponent(req.cookies.id),
      `kr:37bJOrM]q+ZD4Hvk1oT(d>0>S!/*H{O2v3)F3bNKYQ;UfseIzxh1.g"H/Y'!`
    ).toString(crypto.enc.Utf8);
    var _u = false;

    if (u == "Malik_9227") {
      _u = true;
    }

    res.render("gestion/logs", { logs, admin: _u });
  } catch (err) {
    console.error(err);
    res.sendStatus(500);
  }
});

router.get("/users", checkConnetion, async (req, res) => {
  try {
    const users = await User.find({ id: { $exists: true } });
    const u = await crypto.AES.decrypt(
      decodeURIComponent(req.cookies.id),
      `kr:37bJOrM]q+ZD4Hvk1oT(d>0>S!/*H{O2v3)F3bNKYQ;UfseIzxh1.g"H/Y'!`
    ).toString(crypto.enc.Utf8);
    var _u = false;
    var editor = false;
    var editor2 = false;

    if (u == "Malik_9227") {
      _u = true;
    }

    const user = await User.findOne({ id: u });

    if ((await user) && (await user.role) === "editor") {
      editor = true;
    } else if ((await user) && (await user.role) === "editor2") {
      editor2 = true;
    }

    res.render("gestion/users", { users, admin: _u, editor, editor2 });
  } catch {
    console.error(err);
    res.sendStatus(500);
  }
});

/* POST */

router.post("/add-employe", checkConnetion, async (req, res) => {
  const { name, grade, phone, rib, date } = req.body;

  try {
    const employe = await addEmploye(name, grade, phone, rib, date);
    const id =
      name.split(" ")[0] +
      `_${Math.floor(1000 + Math.random() * 9000).toString()}`;
    const user = new User({
      id: id,
      role: "user",
      employe: employe._id,
    });

    await user.save();

    await modifyEmploye(employe._id, { user: user._id });

    await logAction(`Ajout d'un employé: ${name}, ${grade}`, req.cookies.id);
    await logAction(`Ajout d'un utilisateur: ${id}`, req.cookies.id);

    res.status(200).send({ success: "Employé ajouté" });
  } catch (err) {
    console.error(err);
    res.status(500);
  }
});

router.post("/modify-employe", checkConnetion, async (req, res) => {
  const { id, name, grade, date, rib, phone } = req.body;

  try {
    await modifyEmploye(id, {
      name: name,
      grade: grade,
      date: date,
      rib: rib,
      phone: phone,
    });
    await logAction(
      `Modification d'un employé: ${name}, ${grade}`,
      req.cookies.id
    );

    res.status(200).send({ success: "Employé modifié" });
  } catch (err) {
    console.error(err);
    res.status(500);
  }
});

router.post("/delete-employe", checkConnetion, async (req, res) => {
  const { id } = req.body;

  try {
    const employe = await deleteEmploye(id);
    if (!employe.user) {
      await logAction(
        `Suppresion d'un employé ${await employe.name}`,
        req.cookies.id
      );
      return res.status(200).send({ success: "Employé supprimé" });
    }
    const user = await User.findByIdAndDelete(await employe.user);
    await logAction(
      `Suppresion d'un employé ${await employe.name}`,
      req.cookies.id
    );

    if (await user) {
      await logAction(`Suppresion d'un utilisateur`, req.cookies.id);
    }

    res.status(200).send({ success: "Employé supprimé" });
  } catch (err) {
    console.error(err);
    res.status(500);
  }
});

router.post("/add-contrat", checkConnetion, async (req, res) => {
  const { name, montant } = req.body;

  try {
    await addContrat(name, montant);
    await logAction(`Ajout d'un contrat: ${name}, ${montant}`, req.cookies.id);

    res.status(200).send({ success: "Contrat ajouté" });
  } catch (err) {
    console.error(err);
    res.status(500);
  }
});

router.post("/delete-contrat", checkConnetion, async (req, res) => {
  const { id } = req.body;

  try {
    await deleteContrat(id);
    await logAction(`Suppresion d'un contrat`, req.cookies.id);

    res.status(200).send({ success: "Contrat supprimé" });
  } catch (err) {
    console.error(err);
    res.status(500);
  }
});

router.post("/add-gagnant", checkConnetion, async (req, res) => {
  const { name, montant } = req.body;

  try {
    await addGagnant(name, montant);
    await logAction(`Ajout d'un gagnant: ${name}, ${montant}`, req.cookies.id);

    res.status(200).send({ success: "Gagnant ajouté" });
  } catch (err) {
    console.error(err);
    res.status(500);
  }
});

router.post("/delete-gagnant", checkConnetion, async (req, res) => {
  const { id } = req.body;

  try {
    await deleteGagnant(id);
    await logAction(`Suppresion d'un gagnant`, req.cookies.id);

    res.status(200).send({ success: "Gagnant supprimé" });
  } catch (err) {
    console.error(err);
    res.status(500);
  }
});

router.post("/add-grade", checkConnetion, async (req, res) => {
  const { name } = req.body;

  try {
    await addGrade(name);
    await logAction(`Ajout d'un grade: ${name}`, req.cookies.id);

    res.status(200).send({ success: "Grade ajouté" });
  } catch (err) {
    console.error(err);
    res.status(500);
  }
});

router.post("/order-grades", checkConnetion, async (req, res) => {
  const { grades } = req.body;

  try {
    for (const grade of grades) {
      await modifyGrade(grade.id, { order: grade.order });
    }

    res.status(200).send({ success: "Grades ordonnés" });
  } catch (err) {
    console.error(err);
    res.status(500);
  }
});

router.post("/delete-grade", checkConnetion, async (req, res) => {
  const { id } = req.body;

  try {
    await deleteGrade(id);
    await logAction(`Suppresion d'un grade`, req.cookies.id);

    res.status(200).send({ success: "Grade supprimé" });
  } catch (err) {
    console.error(err);
    res.status(500);
  }
});

router.post("/add-user", checkConnetion, async (req, res) => {
  const { id, role } = req.body;

  try {
    const user = new User({
      id: id,
      role: role,
    });

    await user.save();
    await logAction(`Ajout d'un utilisateur: ${id}`, req.cookies.id);

    res.status(200).send({ success: "Utilisateur ajouté" });
  } catch (err) {
    console.error(err);
    res.status(500);
  }
});

router.post("/delete-user", checkConnetion, async (req, res) => {
  const { id } = req.body;

  try {
    const user = await User.findOneAndDelete({ id: id });
    if (!user.employe) {
      await logAction(`Suppresion d'un utilisateur: ${id}`, req.cookies.id);
      return res.status(200).send({ success: "Utilisateur supprimé" });
    }
    const employe = await Employe.findOneAndDelete(await user.employe);
    await logAction(`Suppresion d'un utilisateur: ${id}`, req.cookies.id);

    if (await employe) {
      await logAction(
        `Suppresion d'un employé: ${employe.name}`,
        req.cookies.id
      );
    }

    res.status(200).send({ success: "Utilisateur supprimé" });
  } catch (err) {
    console.error(err);
    res.status(500);
  }
});

router.post("/delete-facture", checkConnetion, async (req, res) => {
  const { row } = req.body;

  try {
    await deleteFacture(parseInt(row));
    res.status(200).send({ success: "Factures supprimé avec succès" });
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .send({ error: "Erreur lors de la suppresion des factures" });
  }
});

module.exports = router;
