const express = require("express");
const crypto = require("crypto-js");

const router = express.Router();

const {
  supabase,
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
  try {
    const _admin = crypto.AES.decrypt(
      admin,
      `kr:37bJOrM]q+ZD4Hvk1oT(d>0>S!/*H{O2v3)F3bNKYQ;UfseIzxh1.g"H/Y'!`
    ).toString(crypto.enc.Utf8);

    if (!_admin) {
      return console.error("Non décodé");
    }

    const { error } = await supabase
      .from("log")
      .insert([{ action, admin: _admin }]);
    if (error) {
      console.error("Erreur lors de l'enregistrement du log:", error);
    }
  } catch (error) {
    console.error("Erreur lors de l'enregistrement du log:", error);
  }
}

const checkConnetion = async (req, res, next) => {
  if (req.cookies.id) {
    const d = crypto.AES.decrypt(
      decodeURIComponent(req.cookies.id),
      `kr:37bJOrM]q+ZD4Hvk1oT(d>0>S!/*H{O2v3)F3bNKYQ;UfseIzxh1.g"H/Y'!`
    ).toString(crypto.enc.Utf8);

    const { data: user, error } = await supabase
      .from("user")
      .select("*")
      .eq("id", d)
      .single();

    if (error) {
      console.error("Erreur lors de la recherche de l'utilisateur:", error);
      return res.redirect("/");
    }

    if (
      user &&
      (user.role === "admin" ||
        user.role === "editor" ||
        user.role === "editor2")
    ) {
      return next();
    }

    if (!(await isAdmin(req))) return res.redirect("/");
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

  const { data: user, error } = await supabase
    .from("user")
    .select("role")
    .eq("id", d)
    .single();

  if (error) {
    console.error("Erreur lors de la recherche de l'utilisateur:", error);
    return false;
  }

  if (
    user &&
    (user.role === "admin" || user.role === "editor" || user.role === "editor2")
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

    const date = `${dateParam.getFullYear()}-${String(
      dateParam.getMonth() + 1
    ).padStart(2, "0")}-${dateParam.getDate()}`;

    const backup = await getBackup(date);

    res.render("gestion/historyDate", {
      employees: backup ? backup.employeesMetrics : [],
      date: req.params.date,
    });
  } catch (err) {
    console.error(err);
    res.sendStatus(500);
  }
});

router.get("/logs", checkConnetion, async (req, res) => {
  try {
    const { data: logs, error: logsError } = await supabase
      .from("log")
      .select("*")
      .order("timestamp", { ascending: false });

    if (logsError) {
      console.error("Erreur lors de la récupération des log:", logsError);
      return res.sendStatus(500);
    }

    const u = crypto.AES.decrypt(
      decodeURIComponent(req.cookies.id),
      `kr:37bJOrM]q+ZD4Hvk1oT(d>0>S!/*H{O2v3)F3bNKYQ;UfseIzxh1.g"H/Y'!`
    ).toString(crypto.enc.Utf8);
    var _u = false;

    if (u === "Malik_9227") {
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
    const { data: users, error: usersError } = await supabase
      .from("user")
      .select("*")
      .not("id", "is", null);

    if (usersError) {
      console.error(
        "Erreur lors de la récupération des utilisateurs:",
        usersError
      );
      return res.sendStatus(500);
    }

    const u = crypto.AES.decrypt(
      decodeURIComponent(req.cookies.id),
      `kr:37bJOrM]q+ZD4Hvk1oT(d>0>S!/*H{O2v3)F3bNKYQ;UfseIzxh1.g"H/Y'!`
    ).toString(crypto.enc.Utf8);
    var _u = false;
    var editor = false;
    var editor2 = false;

    if (u === "Malik_9227") {
      _u = true;
    }

    const { data: user, error: userError } = await supabase
      .from("user")
      .select("*")
      .eq("id", u)
      .single();

    if (user && user.role === "editor") {
      editor = true;
    } else if (user && user.role === "editor2") {
      editor2 = true;
    }

    res.render("gestion/users", { users, admin: _u, editor, editor2 });
  } catch (err) {
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

    const { data: user, error: userError } = await supabase
      .from("user")
      .insert([{ id: id, role: "user", employe: employe._id }])
      .select()
      .single();

    if (userError) {
      console.error("Erreur lors de l'ajout de l'utilisateur:", userError);
      return res
        .status(500)
        .send({ error: "Erreur lors de l'ajout de l'employé" });
    }

    await modifyEmploye(employe._id, { user: user._id });

    await logAction(`Ajout d'un employé: ${name}, ${grade}`, req.cookies.id);
    await logAction(`Ajout d'un utilisateur: ${id}`, req.cookies.id);

    res.status(200).send({ success: "Employé ajouté" });
  } catch (err) {
    console.error(err);
    res.status(500).send({ error: "Erreur lors de l'ajout de l'employé" });
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
    res
      .status(500)
      .send({ error: "Erreur lors de la modification de l'employé" });
  }
});

router.post("/delete-employe", checkConnetion, async (req, res) => {
  const { id } = req.body;

  try {
    const employe = await deleteEmploye(id);

    if (employe) {
      await logAction(
        `Suppresion d'un employé ${employe.name}`,
        req.cookies.id
      );
      await logAction(`Suppresion d'un utilisateur`, req.cookies.id);

      return res.status(200).send({ success: "Employé supprimé" });
    }
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .send({ error: "Erreur lors de la suppression de l'employé" });
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
    res.status(500).send({ error: "Erreur lors de l'ajout du contrat" });
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
    res.status(500).send({ error: "Erreur lors de la suppression du contrat" });
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
    res.status(500).send({ error: "Erreur lors de l'ajout du gagnant" });
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
    res.status(500).send({ error: "Erreur lors de la suppression du gagnant" });
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
    res.status(500).send({ error: "Erreur lors de l'ajout du grade" });
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
    res
      .status(500)
      .send({ error: "Erreur lors de l'ordonnancement des grades" });
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
    res.status(500).send({ error: "Erreur lors de la suppression du grade" });
  }
});

router.post("/add-user", checkConnetion, async (req, res) => {
  const { id, role } = req.body;

  try {
    const { error: userInsertError } = await supabase
      .from("user")
      .insert([{ id: id, role: role }]);

    if (userInsertError) {
      console.error(
        "Erreur lors de l'ajout de l'utilisateur:",
        userInsertError
      );
      return res
        .status(500)
        .send({ error: "Erreur lors de l'ajout de l'utilisateur" });
    }

    await logAction(`Ajout d'un utilisateur: ${id}`, req.cookies.id);

    res.status(200).send({ success: "Utilisateur ajouté" });
  } catch (err) {
    console.error(err);
    res.status(500).send({ error: "Erreur lors de l'ajout de l'utilisateur" });
  }
});

router.post("/modify-user", checkConnetion, async (req, res) => {
  const { _id, id, role } = req.body;

  try {
    const { error: userUpdateError } = await supabase
      .from("user")
      .update({ role: role })
      .eq("_id", _id);

    if (userUpdateError) {
      console.error(
        "Erreur lors de la modification de l'utilisateur:",
        userUpdateError
      );
      return res
        .status(500)
        .send({ error: "Erreur lors de la modification de l'utilisateur" });
    }

    await logAction(`Modification d'un utilisateur: ${id}, Rôle : ${role}`, req.cookies.id);

    res.status(200).send({ success: "Utilisateur modifié" });
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .send({ error: "Erreur lors de la modification de l'utilisateur" });
  }
});

router.post("/delete-user", checkConnetion, async (req, res) => {
  const { id } = req.body;

  try {
    const { data: user, error: userError } = await supabase
      .from("user")
      .select("employe")
      .eq("id", id)
      .single();

    if (userError) {
      console.error("Erreur lors de la recherche de l'utilisateur:", userError);
      return res
        .status(500)
        .send({ error: "Erreur lors de la suppression de l'utilisateur" });
    }

    const { error: userDeleteError } = await supabase
      .from("user")
      .delete()
      .eq("id", id);
    if (userDeleteError) {
      console.error(
        "Erreur lors de la suppression de l'utilisateur:",
        userDeleteError
      );
    }
    await logAction(`Suppresion d'un utilisateur: ${id}`, req.cookies.id);
    if (user && user.employe) {
      await deleteEmploye(user.employe);
      await logAction(`Suppresion d'un employé`, req.cookies.id);
    }

    res.status(200).send({ success: "Utilisateur supprimé" });
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .send({ error: "Erreur lors de la suppression de l'utilisateur" });
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
