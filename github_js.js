// ============================================================
// github.js — Sauvegarde des recettes via l'API GitHub
// Ce fichier lit le JSON existant, y ajoute la nouvelle recette,
// et pousse le tout dans votre repo GitHub.
// ============================================================

// ⚠️ À MODIFIER : votre nom d'utilisateur et le nom du repo
const GITHUB_USER = "aloysemaille";
const GITHUB_REPO = "RecipiesStorage";
const FICHIER_RECETTES = "data/recettes.json"; // Chemin dans le repo

// ============================================================
// SAUVEGARDER
// Appelé au clic sur le bouton "Sauvegarder"
// ============================================================
async function sauvegarder() {
  const msg = document.getElementById("message");
  const token = document.getElementById("token").value.trim();

  // Vérification du token
  if (!token) {
    msg.textContent = "❌ Veuillez entrer votre token GitHub.";
    return;
  }

  // Vérification des champs obligatoires
  const nom = document.getElementById("nom").value.trim();
  const categorie = document.getElementById("categorie").value;
  const culture = document.getElementById("culture").value.trim();

  if (!nom || !categorie || !culture) {
    msg.textContent = "❌ Les champs Nom, Catégorie et Culture sont obligatoires.";
    return;
  }

  // On récupère les vibes cochées (plusieurs possibles)
  const vibes = [...document.querySelectorAll(".cases-a-cocher input:checked")]
    .map(cb => cb.value);

  // On construit l'objet recette
  const nouvelleRecette = {
    // L'ID est généré automatiquement depuis le nom (ex: "Pad Thaï" → "pad-thai")
    id: nom.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, ""),
    nom,
    categorie,
    culture,
    proteine: document.getElementById("proteine").value || null,
    glucide: document.getElementById("glucide").value || null,
    vibe: vibes,
    temps: parseInt(document.getElementById("temps").value) || null,
    image: document.getElementById("image").value.trim() || null,
    recette: document.getElementById("recette").value === "true",
    notes: document.getElementById("notes").value.trim() || null
  };

  msg.textContent = "⏳ Sauvegarde en cours...";

  try {
    // --------------------------------------------------------
    // ÉTAPE 1 : Lire le fichier actuel sur GitHub
    // L'API retourne le contenu en base64 + le SHA du fichier
    // (le SHA est obligatoire pour pouvoir écrire dessus ensuite)
    // --------------------------------------------------------
    const urlFichier = `https://api.github.com/repos/${GITHUB_USER}/${GITHUB_REPO}/contents/${FICHIER_RECETTES}`;

    const lectureReponse = await fetch(urlFichier, {
      headers: {
        Authorization: `token ${token}`,
        Accept: "application/vnd.github.v3+json"
      }
    });

    if (!lectureReponse.ok) throw new Error("Impossible de lire le fichier JSON sur GitHub.");

    const lectureData = await lectureReponse.json();

    // On décode le contenu base64 en texte lisible
    const contenuActuel = JSON.parse(atob(lectureData.content));
    const sha = lectureData.sha; // Nécessaire pour la mise à jour

    // --------------------------------------------------------
    // ÉTAPE 2 : Vérifier que l'ID n'existe pas déjà
    // --------------------------------------------------------
    if (contenuActuel.find(r => r.id === nouvelleRecette.id)) {
      msg.textContent = `❌ Une recette avec l'ID "${nouvelleRecette.id}" existe déjà. Modifiez légèrement le nom.`;
      return;
    }

    // --------------------------------------------------------
    // ÉTAPE 3 : Ajouter la nouvelle recette et réécrire le fichier
    // --------------------------------------------------------
    const nouveauContenu = [...contenuActuel, nouvelleRecette];

    // On encode le nouveau JSON en base64 (obligatoire pour l'API GitHub)
    const contenuBase64 = btoa(unescape(encodeURIComponent(
      JSON.stringify(nouveauContenu, null, 2)
    )));

    const ecritureReponse = await fetch(urlFichier, {
      method: "PUT",
      headers: {
        Authorization: `token ${token}`,
        Accept: "application/vnd.github.v3+json",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        message: `Ajout recette : ${nom}`, // Message de commit
        content: contenuBase64,
        sha // SHA récupéré à l'étape 1
      })
    });

    if (!ecritureReponse.ok) throw new Error("Erreur lors de l'écriture sur GitHub.");

    // --------------------------------------------------------
    // SUCCÈS
    // --------------------------------------------------------
    msg.textContent = `✅ "${nom}" ajoutée avec succès ! Le site se mettra à jour dans quelques secondes.`;
    msg.style.color = "green";

    // On vide le formulaire après succès
    document.querySelectorAll("input, textarea, select").forEach(el => {
      if (el.type === "checkbox") el.checked = false;
      else if (el.id !== "token") el.value = ""; // On garde le token pour faciliter les ajouts multiples
    });

  } catch (erreur) {
    msg.textContent = `❌ Erreur : ${erreur.message}`;
    msg.style.color = "red";
    console.error(erreur);
  }
}
