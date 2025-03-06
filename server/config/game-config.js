// Configuració centralitzada del joc

// Factor d'escala
const ESCALA = 4;

// Constants bàsiques
const MAXPED = 8; // Màxim d'estrelles
const INCHV = ESCALA;
const MIDAJ = 4 * ESCALA; // Mida jugador
const MIDAP = 2 * ESCALA; // Mida estrelles

// Dimensions àrea de joc
const MINH = 40 * MIDAJ;
const MAXH = 2 * MINH;
const MINV = 30 * MIDAJ;
const MAXV = 2 * MINV;

// Piràmide
const NFPMIN = 4;
const NFPMAX = 8;
const PH = 4 * ESCALA;
const PV = 3 * ESCALA;
const PHMAX = PH * NFPMAX;
const PVMAX = PV * NFPMAX;

// Temps entre moviments (ms)
const TEMPS = 100;

// Configuració per defecte
let config = {
  width: MINH,
  height: MINV,
  pisos: NFPMIN,
  pedres: ((NFPMIN + 1) * NFPMIN) / 2,
  scoreLimit: 10, // Puntuació per guanyar
  timeLimit: 0, // Sense límit de temps
};

const gameConfig = {
  // Constants
  ESCALA,
  MAXPED,
  INCHV,
  MIDAJ,
  MIDAP,
  MINH,
  MAXH,
  MINV,
  MAXV,
  NFPMIN,
  NFPMAX,
  PH,
  PV,
  PHMAX,
  PVMAX,
  TEMPS,

  // Mètodes de configuració
  getConfig: () => ({ ...config }),
  updateConfig: (newConfig) => {
    // Validació de valors
    if (
      newConfig.width < MINH ||
      newConfig.width > MAXH ||
      newConfig.height < MINV ||
      newConfig.height > MAXV ||
      newConfig.pisos < NFPMIN ||
      newConfig.pisos > NFPMAX
    ) {
      return false;
    }

    config = {
      ...newConfig,
      pedres: ((newConfig.pisos + 1) * newConfig.pisos) / 2,
    };

    return true;
  },
};

module.exports = gameConfig;
