const express = require("express");
const crypto = require("crypto-js");
const validator = require("validator");

const router = express.Router();

const { supabase } = require("../lib/google"); // Assurez-vous d'avoir un client Supabase initialisé
const { getEmployesWithMetrics, addHistory } = require("../lib/google");

async function logAction(action, admin) {
  const { error } = await supabase.from("log").insert([{ action, admin }]);
  if (error) {
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

    if (user && (user.role === "admin" || user.role === "editor")) {
      return next();
    }

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

  if (user && (user.role === "admin" || user.role === "editor")) {
    return true;
  } else {
    return false;
  }
}

function getCurrentWeekAndYear(date = new Date()) {
  const startOfYear = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const daysSinceStartOfYear = Math.floor(
    (date - startOfYear) / (24 * 60 * 60 * 1000)
  );
  const weekNumber = Math.ceil((daysSinceStartOfYear + startOfYear.getUTCDay() + 1) / 7);
  const year = date.getFullYear();

  return { week: String(weekNumber), year: String(year) };
}

router.post("/getData", checkConnetion, async (req, res) => {
  res.status(200).send(await getEmployesWithMetrics());
});

router.post("/stats", checkConnetion, async (req, res) => {
  const { value } = req.body;
  const { week, year } = getCurrentWeekAndYear();

  if (!(await isAdmin(req))) return;

  try {
    await addHistory(week, year, value);
    res.status(200).send({ success: "Statistiques ajoutées" });
  } catch (err) {
    console.error(err);
    res.status(500).send({ error: "Erreur lors de l'ajout des statistiques" });
  }
});

router.post("/login", async (req, res) => {
  const { id } = req.body;

  try {
    if (!id || id.includes("OR 1=1") || id.includes("1=1")) {
      return res.status(400).send({ error: "Identifiant invalide" });
    }

    const escapedId = validator.escape(id);

    const { data: user, error } = await supabase
      .from("user")
      .select("*")
      .eq("id", escapedId)
      .single();

    if (error) {
      console.error("Erreur lors de la recherche de l'utilisateur:", error);
      return res.status(500).send({ error: "Erreur interne du serveur" });
    }

    if (!user) return res.status(200).send({ error: "Identifiant incorrect" });

    res.cookie(
      "id",
      crypto.AES.encrypt(
        escapedId,
        `kr:37bJOrM]q+ZD4Hvk1oT(d>0>S!/*H{O2v3)F3bNKYQ;UfseIzxh1.g"H/Y'!`
      ).toString(),
      {
        httpOnly: false,
        signed: false,
        maxAge: 1000 * 60 * 60 * 24 * 30.5 * 12,
        secure: false,
      }
    );

    await logAction(`Utilisateur connecté`, escapedId);

    res.status(200).send({ success: "Connexion réussie" });
  } catch (err) {
    console.error(err);
    res.status(500).send({ error: "Erreur interne du serveur" });
  }
});

module.exports = router;