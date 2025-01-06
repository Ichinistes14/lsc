require("dotenv").config();

const express = require("express");
const path = require("path");
const mongoose = require("mongoose");
const cookieParser = require("cookie-parser");
const bodyParser = require("body-parser");
const crypto = require("crypto-js");

const {
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
} = require("./lib/google");

const User = require("./models/User");
const Log = require("./models/Log");
const Employe = require("./models/Employe");

const apiRouter = require("./router/api.routes");
const gestionRouter = require("./router/gestion.routes");

const app = express();

mongoose.connect("mongodb://jonathan_devlin_ichiniste14:Python44**$$**@mongo.db.mdbgo.com:8604/jonathan_devlin_root");

app.use(express.static(path.join(__dirname, "public")));
app.use(
  "/",
  express.static(path.join(__dirname, "node_modules/bootstrap/dist/"))
);
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

    if (await User.findOne({ id: d })) {
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

  const user = await User.findOne({ id: d });

  if (user.role === "admin" || user.role === "editor" || user.role === "editor2") {
    return true;
  } else {
    return false;
  }
}

/* GET */

app.get("/login", (req, res) => {
  res.render("login");
});

app.get("/", checkConnetion, async (req, res) => {
  try {
    const data = await generateMetrics();

    res.render("index", { data, isa: isAdmin(req) });
  } catch (error) {
    console.error(error);
    res.sendStatus(500);
  }
});

app.get("/stats", checkConnetion, async (req, res) => {
  const history = await getHistory();
  res.render("stats", { data: history, isa: isAdmin(req) });
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
      isa: isAdmin(req),
    });
  } catch (error) {
    console.error(error);
    res.sendStatus(500);
  }
});

app.get("/facture", checkConnetion, async (req, res) => {
  try {
    const sheetData = await getFactures();

    sheetData.forEach((t) => {
      t.montant = `$${t.montant.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ")}`
    });

    res.render("facture", {
      transactions: sheetData,
      employee: undefined,
      isa: isAdmin(req),
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

    sheetData.forEach((t) => {
      t.montant = `$${t.montant.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ")}`
    });

    res.render("facture", {
      transactions: sheetData,
      employee: employeeName,
      isa: isAdmin(req),
    });
  } catch (error) {
    console.error(error);
    res.sendStatus(500);
  }
});

app.get("/tombola", checkConnetion, async (req, res) => {
  const tombolas = await getTombola();
  const employees = await Employe.find();
  res.render("tombola", { tombolas, employees, isa: isAdmin(req) });
});

app.get("/message", checkConnetion, async (req, res) => {
  const grades = await getGrades();

  res.render("message", { grades, isa: isAdmin(req) });
});

/* POST */

app.post("/add-facture", checkConnetion, async (req, res) => {
  try {
    const { name, type, montant, contrat, gagnant } = req.body;

    await logAction(`Facture ajoutée pour ${name}`, req.cookies.id);
    await addFacture(name, montant, type, contrat, gagnant);
    res.status(200).send({ success: "Facture ajoutée avec succès" });
  } catch (err) {
    console.error(err);
    res.status(500).send({ error: "Erreur lors de l'ajout de la facture" });
  }
});

app.post("/modify-facture", checkConnetion, async (req, res) => {
  try {
    const { id, type, montant, contrat, gagnant } = req.body;

    await logAction(`Facture modifié, facture ${id}`, req.cookies.id);
    await modifyFacture(id, {type, montant, contrat, gagnant});
    res.status(200).send({ success: "Facture modifié avec succès" });
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .send({ error: "Erreur lors de la modification de la facture" });
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
    res
      .status(500)
      .send({ error: "Erreur lors de la suppresion de la facture" });
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

const db = mongoose.connection;
db.on("error", (err) => console.error("MongoDB connection error:", err));
db.once("open", async () => {
  console.log(`[DATABASE] Connexion établie`);
  const server = app.listen(3000, "0.0.0.0", async () => {
    console.log(
      `[SERVER] Serveur lancé à https://${server.address().address}:${
        server.address().port
      }`
    );
    refreshGrades();
  });
});
