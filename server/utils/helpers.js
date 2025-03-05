/**
 * Funciones de utilidad generales
 */

const helpers = {
  /**
   * Genera un número aleatorio entre min y max (inclusive)
   */
  randomInt: (min, max) => {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  },

  /**
   * Calcula la distancia entre dos puntos
   */
  calcDistance: (x1, y1, x2, y2) => {
    return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
  },

  /**
   * Formatea el tiempo en formato MM:SS
   */
  formatTime: (seconds) => {
    const mins = Math.floor(seconds / 60)
      .toString()
      .padStart(2, "0");
    const secs = (seconds % 60).toString().padStart(2, "0");
    return `${mins}:${secs}`;
  },

  /**
   * Genera un identificador único
   */
  generateId: () => {
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
  },

  /**
   * Función segura para parsear JSON
   */
  safeJsonParse: (str) => {
    try {
      return JSON.parse(str);
    } catch (e) {
      console.error("Error al parsear JSON:", e);
      return null;
    }
  },
};

module.exports = helpers;
