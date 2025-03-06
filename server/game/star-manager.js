/**
 * Gestió d'estrelles del joc
 */

const gameConfig = require("../config/game-config");

// Variables d'estat
let estrellas = [];
let estrellasTimers = {};
let idEstrella = 1;

const starManager = {
  getAllStars: () => [...estrellas],
  getStar: (id) => estrellas.find((e) => e.id === id),

  initializeStars: () => {
    // Neteja de temporitzadors antics
    Object.values(estrellasTimers).forEach((timer) => clearTimeout(timer));
    estrellasTimers = {};

    estrellas = []; // Buida les estrelles existents

    // Generació d'estrelles inicials
    for (let i = 0; i < gameConfig.MAXPED; i++) {
      estrellas.push(starManager.generateStar());
    }

    return estrellas;
  },

  generateStar: () => {
    const config = gameConfig.getConfig();
    const margen = gameConfig.MIDAP * 2;

    // Posició aleatòria evitant els límits
    const x = margen + Math.random() * (config.width - margen * 2);
    const y = margen + Math.random() * (config.height - margen * 2);

    const id = idEstrella++;

    // Temps de vida aleatori entre 15 i 45 segons
    const tiempoVida = 15000 + Math.random() * 30000;

    const estrella = { x, y, id };

    starManager.scheduleStarRepositioning(estrella, tiempoVida);

    return estrella;
  },

  scheduleStarRepositioning: (estrella, tiempoVida) => {
    if (estrellasTimers[estrella.id]) {
      clearTimeout(estrellasTimers[estrella.id]);
    }

    if (!tiempoVida || tiempoVida <= 0) return;

    estrellasTimers[estrella.id] = setTimeout(() => {
      const index = estrellas.findIndex((e) => e.id === estrella.id);
      if (index !== -1) {
        estrellas.splice(index, 1);

        // Notifica desaparició
        if (typeof starManager.onStarDisappear === "function") {
          starManager.onStarDisappear(estrella.id);
        }

        // Crea una nova estrella
        const nuevaEstrella = starManager.generateStar();
        estrellas.push(nuevaEstrella);

        if (typeof starManager.onStarsUpdated === "function") {
          starManager.onStarsUpdated(estrellas);
        }
      }
    }, tiempoVida);
  },

  removeStar: (starId) => {
    const index = estrellas.findIndex((e) => e.id === starId);
    if (index === -1) return null;

    const estrella = estrellas[index];

    // Cancel·la temporitzador
    if (estrellasTimers[starId]) {
      clearTimeout(estrellasTimers[starId]);
      delete estrellasTimers[starId];
    }

    estrellas.splice(index, 1);

    // Genera una nova estrella
    const nuevaEstrella = starManager.generateStar();
    estrellas.push(nuevaEstrella);

    return {
      removedStar: estrella,
      newStar: nuevaEstrella,
    };
  },

  clearTimers: () => {
    Object.values(estrellasTimers).forEach((timer) => clearTimeout(timer));
    estrellasTimers = {};
  },

  ensureStarCount: () => {
    while (estrellas.length < gameConfig.MAXPED) {
      estrellas.push(starManager.generateStar());
    }
    return estrellas;
  },

  // Callbacks per a notificacions
  onStarDisappear: null,
  onStarsUpdated: null,
};

module.exports = starManager;
