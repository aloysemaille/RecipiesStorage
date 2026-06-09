// ============================================================
// app.js — Galerie et filtres
// ============================================================

// Les filtres actifs : un tableau de valeurs par catégorie
const filtresActifs = {
  categorie: [],
  culture: [],
  proteine: [],
  vibe: []
};

let toutesLesRecettes = []; // Stocke toutes les recettes chargées

// ============================================================
// CHARGEMENT DES RECETTES
// On lit le fichier data/recettes.json au démarrage
// ============================================================
async function chargerRecettes() {
  const reponse = await fetch("data/recettes.json");
  toutesLesRecettes = await reponse.json();

  construireFiltres(toutesLesRecettes);
  afficherRecettes(toutesLesRecettes);
}

// ============================================================
// CONSTRUCTION DES FILTRES
// On récupère toutes les valeurs uniques présentes dans les recettes
// et on crée un bouton cliquable pour chacune
// ============================================================
function construireFiltres(recettes) {
  // Collecte les valeurs uniques pour chaque dimension
  const valeurs = {
    categorie: [...new Set(recettes.map(r => r.categorie).filter(Boolean))],
    culture:   [...new Set(recettes.map(r => r.culture).filter(Boolean))].sort(),
    proteine:  [...new Set(recettes.map(r => r.proteine).filter(Boolean))],
    vibe:      [...new Set(recettes.flatMap(r => r.vibe || []))]
  };

  // Pour chaque dimension, on injecte les boutons dans le HTML
  for (const [dimension, liste] of Object.entries(valeurs)) {
    const conteneur = document.getElementById(`filtre-${dimension}`);
    conteneur.innerHTML = ""; // On vide avant de reconstruire

    liste.forEach(valeur => {
      const btn = document.createElement("button");
      btn.textContent = valeur;
      btn.className = "filtre-btn";
      btn.dataset.dimension = dimension;
      btn.dataset.valeur = valeur;
      btn.onclick = () => toggleFiltre(dimension, valeur, btn);
      conteneur.appendChild(btn);
    });
  }
}

// ============================================================
// TOGGLE FILTRE
// Active ou désactive un filtre au clic
// ============================================================
function toggleFiltre(dimension, valeur, btn) {
  const idx = filtresActifs[dimension].indexOf(valeur);

  if (idx === -1) {
    // Pas encore actif → on l'ajoute
    filtresActifs[dimension].push(valeur);
    btn.classList.add("actif");
  } else {
    // Déjà actif → on le retire
    filtresActifs[dimension].splice(idx, 1);
    btn.classList.remove("actif");
  }

  // On met à jour la galerie
  afficherRecettes(filtrerRecettes());
}

// ============================================================
// FILTRAGE
// Retourne les recettes qui correspondent à TOUS les filtres actifs
// ============================================================
function filtrerRecettes() {
  return toutesLesRecettes.filter(recette => {
    // Pour chaque dimension, si aucun filtre actif → on passe
    // Si des filtres sont actifs → la recette doit matcher au moins un
    const okCategorie = filtresActifs.categorie.length === 0
      || filtresActifs.categorie.includes(recette.categorie);

    const okCulture = filtresActifs.culture.length === 0
      || filtresActifs.culture.includes(recette.culture);

    const okProteine = filtresActifs.proteine.length === 0
      || filtresActifs.proteine.includes(recette.proteine);

    const okVibe = filtresActifs.vibe.length === 0
      || filtresActifs.vibe.some(v => (recette.vibe || []).includes(v));

    return okCategorie && okCulture && okProteine && okVibe;
  });
}

// ============================================================
// RÉINITIALISER LES FILTRES
// ============================================================
function resetFiltres() {
  // On vide tous les filtres actifs
  for (const dim in filtresActifs) filtresActifs[dim] = [];

  // On retire la classe "actif" de tous les boutons
  document.querySelectorAll(".filtre-btn").forEach(btn => btn.classList.remove("actif"));

  // On réaffiche tout
  afficherRecettes(toutesLesRecettes);
}

// ============================================================
// AFFICHAGE DES RECETTES EN GALERIE
// ============================================================
function afficherRecettes(recettes) {
  const galerie = document.getElementById("galerie");
  galerie.innerHTML = ""; // On vide la galerie avant de la reconstruire

  if (recettes.length === 0) {
    galerie.innerHTML = "<p class='vide'>Aucune recette ne correspond à ces filtres.</p>";
    return;
  }

  recettes.forEach(recette => {
    const carte = document.createElement("article");
    carte.className = "carte";

    // Image ou placeholder gris si pas d'image
    const imgHtml = recette.image
      ? `<img src="${recette.image}" alt="${recette.nom}" loading="lazy" />`
      : `<div class="img-placeholder">🍽️</div>`;

    // Badge "Recette dispo" si la recette complète est disponible
    const badgeRecette = recette.recette
      ? `<span class="badge badge-recette">Recette ✓</span>`
      : "";

    // Les vibes sous forme de petits tags
    const vibesHtml = (recette.vibe || [])
      .map(v => `<span class="tag">${v}</span>`)
      .join("");

    // Temps de préparation si renseigné
    const tempsHtml = recette.temps
      ? `<span class="temps">⏱ ${recette.temps} min</span>`
      : "";

    carte.innerHTML = `
      ${imgHtml}
      <div class="carte-contenu">
        <div class="carte-entete">
          <h2>${recette.nom}</h2>
          ${badgeRecette}
        </div>
        <p class="meta">${recette.culture} · ${recette.categorie}</p>
        <p class="meta">${recette.proteine || ""} ${recette.glucide ? "· " + recette.glucide : ""}</p>
        <div class="tags">${vibesHtml}</div>
        ${tempsHtml}
        ${recette.notes ? `<p class="notes">${recette.notes}</p>` : ""}
      </div>
    `;

    galerie.appendChild(carte);
  });
}

// ============================================================
// LANCEMENT
// ============================================================
chargerRecettes();
