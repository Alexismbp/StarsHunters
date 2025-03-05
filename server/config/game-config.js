/**
 * Configuración centralizada del juego
 * Contiene todas las constantes y configuraciones del juego
 */

// Factor de escala
const ESCALA = 4;

// Constantes del juego
const MAXPED = 8; // Número máximo de estrellas en pantalla
const INCHV = ESCALA; // Incremento del desplazamiento
const MIDAJ = 4 * ESCALA; // Tamaño del jugador
const MIDAP = 2 * ESCALA; // Tamaño de las estrellas

// Dimensiones del área de juego
const MINH = 40 * MIDAJ;
const MAXH = 2 * MINH;
const MINV = 30 * MIDAJ;
const MAXV = 2 * MINV;

// Configuración de la pirámide
const NFPMIN = 4;
const NFPMAX = 8;
const PH = 4 * ESCALA;
const PV = 3 * ESCALA;
const PHMAX = PH * NFPMAX;
const PVMAX = PV * NFPMAX;

// Tiempo entre cada movimiento (ms)
const TEMPS = 100;

// Configuración por defecto del juego
let config = {
  width: MINH,
  height: MINV,
  pisos: NFPMIN,
  pedres: ((NFPMIN + 1) * NFPMIN) / 2,
  scoreLimit: 10, // Puntuación para ganar
  timeLimit: 0, // Sin límite de tiempo por defecto
};

const gameConfig = {
  // Constantes
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

  // Métodos para acceder y modificar la configuración
  getConfig: () => ({ ...config }),
  updateConfig: (newConfig) => {
    // Validar los valores antes de actualizar
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
