require("dotenv").config();

const express = require("express");
const path = require("path");
const cookieParser = require("cookie-parser");
const bodyParser = require("body-parser");
const crypto = require("crypto-js");

const {
  supabase,
  refreshGrades,
  getGrades,
  generateMetrics,
  addFacture,
  modifyFacture,
  deleteFacture,
  getContrats,
  getEmployesWithMetrics,
  getFactures,
  getEmployeFactures,
  getHistory,
  getGagnants,
  getTombola,
  addTombola,
  modifyTombola,
  deleteTombola,
  modifyTarif,
  deleteAllTombola,
  getTarif,
  getEmployes,
} = require("./lib/google");

const apiRouter = require("./router/api.routes");
const gestionRouter = require("./router/gestion.routes");

const app = express();

app.use(express.static(path.join(__dirname, "public"), {
  setHeaders: (res, filePath) => {
    if (/\.(js|css|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot)$/.test(filePath)) {
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    }
  }
}));
app.use(express.json());
app.use(
  cookieParser(
    `kr:37bJOrM]q+ZD4Hvk1oT(d>0>S!/*H{O2v3)F3bNKYQ;UfseIzxh1.g"H/Y'!`
  )
);
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use("/api", apiRouter);
app.use("/gestion", gestionRouter);

app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

async function logAction(action, admin) {
  try {
    const _admin = crypto.AES.decrypt(
      admin,
      `kr:37bJOrM]q+ZD4Hvk1oT(d>0>S!/*H{O2v3)F3bNKYQ;UfseIzxh1.g"H/Y'!`
    ).toString(crypto.enc.Utf8);

    if (!_admin) {
      return console.error("Non décodé");
    }

    const { error } = await supabase.from("log").insert([{ action, admin: _admin }]);
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
      res.clearCookie("id");
      return res.redirect("/login");
    }

    if (user) {
      return next();
    }

    res.clearCookie("id");
    res.redirect("/login");
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

  if (user && (user.role === "admin" || user.role === "editor" || user.role === "editor2")) {
    return true;
  } else {
    return false;
  }
}

const isAdmin2 = async (req, res, next) => {
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

  if (user && (user.role === "admin" || user.role === "editor" || user.role === "editor2")) {
    return next();
  } else {
    return false;
  }
};

/* GET */

app.get("/login", (req, res) => {
  res.render("login");
});

app.get("/", checkConnetion, async (req, res) => {
  try {
    const data = await generateMetrics();

    res.render("index", { data, isa: await isAdmin(req) });
  } catch (error) {
    console.error(error);
    res.sendStatus(500);
  }
});

app.get("/stats", checkConnetion, async (req, res) => {
  const history = await getHistory();
  res.render("stats", { data: history, isa: await isAdmin(req) });
});

app.get("/employe", checkConnetion, async (req, res) => {
  try {
    const sheetData = await getEmployesWithMetrics();
    const contrats = await getContrats();
    const gagnants = await getGagnants();

    res.render("employe", {
      employees: sheetData,
      contrats,
      gagnants,
      isa: await isAdmin(req),
    });
  } catch (error) {
    console.error(error);
    res.sendStatus(500);
  }
});

app.get("/facture", checkConnetion, async (req, res) => {
  try {
    const sheetData = await getFactures();
    const employes = await getEmployes();
    const contrats = await getContrats();
    const gagnants = await getGagnants();

    sheetData.forEach((t) => {
      t.montant = `$${t.montant.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ")}`;
    });

    res.render("facture", {
      transactions: sheetData,
      employee: undefined,
      employes,
      contrats,
      gagnants,
      isa: await isAdmin(req),
    });
  } catch (error) {
    console.error(error);
    res.sendStatus(500);
  }
});

app.get("/facture/:employee", checkConnetion, async (req, res) => {
  try {
    const employeeName = req.params.employee;
    const sheetData = await getEmployeFactures(employeeName);
    const employes = await getEmployes();
    const contrats = await getContrats();
    const gagnants = await getGagnants();

    sheetData.forEach((t) => {
      t.montant = `$${t.montant.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ")}`;
    });

    res.render("facture", {
      transactions: sheetData,
      employee: employeeName,
      employes,
      contrats,
      gagnants,
      isa: await isAdmin(req),
    });
  } catch (error) {
    console.error(error);
    res.sendStatus(500);
  }
});

app.get("/tombola", checkConnetion, async (req, res) => {
  const tombolas = await getTombola();
  const employees = await supabase.from('employe').select('*');
  const tarif = await getTarif();

  res.render("tombola", { tombolas, employees: employees.data, tarif, isa: await isAdmin(req) });
});

app.get("/message", checkConnetion, async (req, res) => {
  const grades = await getGrades();

  res.render("message", { grades, isa: await isAdmin(req) });
});

/* POST */

app.post("/add-facture", checkConnetion, async (req, res) => {
  try {
    const { name, type, montant, contrat, gagnant } = req.body;

    await logAction(`Facture ajoutée pour ${name}`, req.cookies.id);
    await addFacture(crypto.AES.decrypt(
      req.cookies.id,
      `kr:37bJOrM]q+ZD4Hvk1oT(d>0>S!/*H{O2v3)F3bNKYQ;UfseIzxh1.g"H/Y'!`
    ).toString(crypto.enc.Utf8), name, montant, type, contrat, gagnant);
    res.status(200).send({ success: "Facture ajoutée avec succès" });
  } catch (err) {
    console.error(err);
    res.status(500).send({ error: "Erreur lors de l'ajout de la facture" });
  }
});

app.post("/info-facture", checkConnetion, async (req, res) => {
  try {
    const { id } = req.body;

    const { data: facture, error } = await supabase
      .from("facture")
      .select("*")
      .eq("_id", id)
      .single();

    if (error) {
      console.error("Erreur lors de la recherche de la facture:", error);
      return res.status(500).send({ error: "Erreur lors de la recherche de la facture" });
    }

    res.status(200).send({ facture });
  } catch (err) {
    console.error(err);
    res.status(500).send({ error: "Erreur lors de la recherche de la facture" });
  }
});

app.post("/modify-facture", checkConnetion, async (req, res) => {
  try {
    const { id, type, montant, contrat, gagnant } = req.body;

    await logAction(`Facture modifié, facture ${id}`, req.cookies.id);
    await modifyFacture(id, { type, montant, contrat, gagnant });
    res.status(200).send({ success: "Facture modifié avec succès" });
  } catch (err) {
    console.error(err);
    res.status(500).send({ error: "Erreur lors de la modification de la facture" });
  }
});

app.post("/delete-facture", checkConnetion, async (req, res) => {
  try {
    const { id } = req.body;

    await logAction(`Facture supprimé`, req.cookies.id);
    await deleteFacture(id);
    res.status(200).send({ success: "Facture supprimé avec succès" });
  } catch (err) {
    console.error(err);
    res.status(500).send({ error: "Erreur lors de la suppresion de la facture" });
  }
});

app.post("/add-tombola", checkConnetion, async (req, res) => {
  try {
    const { employe, name, nombre, phone } = req.body;

    await logAction(`Tombola ajoutée pour ${employe}, ${name}, ${nombre}, ${phone}`, req.cookies.id);
    await addTombola(employe, name, nombre, phone);
    res.status(200).send({ success: "Tombola ajoutée avec succès" });
  } catch (err) {
    console.error(err);
    res.status(500).send({ error: "Erreur lors de l'ajout de la tombola" });
  }
});

app.post("/modify-tombola", checkConnetion, async (req, res) => {
  try {
    const { id, employe, name, nombre, phone } = req.body;

    await logAction(`Tombola modifié pour ${employe}, ${name}, ${nombre}, ${phone}`, req.cookies.id);
    await modifyTombola(id, { employe, name, nombre, phone });
    res.status(200).send({ success: "Tombola modifié avec succès" });
  } catch (err) {
    console.error(err);
    res.status(500).send({ error: "Erreur lors de la modification de la tombola" });
  }
});

app.post("/delete-tombola", checkConnetion, async (req, res) => {
  try {
    const { id } = req.body;

    await logAction(`Tombola supprimé`, req.cookies.id);
    await deleteTombola(id);
    res.status(200).send({ success: "Tombola supprimé avec succès" });
  } catch (err) {
    console.error(err);
    res.status(500).send({ error: "Erreur lors de la suppresion de la tombola" });
  }
});

app.post("/modify-tarif", isAdmin2, async (req, res) => {
  try {
    const { prix } = req.body;

    await logAction(`Tarif tombola modifié pour ${prix}`, req.cookies.id);
    await modifyTarif(prix);
    res.status(200).send({ success: "Tarif modifié avec succès" });
  } catch (err) {
    console.error(err);
    res.status(500).send({ error: "Erreur lors de la modification du tarif" });
  }
});

app.post("/delete-all-tombola", isAdmin2, async (req, res) => {
  try {
    await logAction(`Toute les tombola sont supprimés`, req.cookies.id);
    await deleteAllTombola();
    res.status(200).send({ success: "Tombola supprimé avec succès" });
  } catch (err) {
    console.error(err);
    res.status(500).send({ error: "Erreur lors de la suppresion de la tombola" });
  }
});

// START SERVER

const server = app.listen(3000, "0.0.0.0", async () => {
  console.log(
    `[SERVER] Serveur lancé à https://${server.address().address}:${server.address().port}`
  );
  await refreshGrades();
});