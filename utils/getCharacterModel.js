module.exports = function getCharacterModel(gameSystem = "aria") {
    switch (gameSystem.toLowerCase()) {
      case "aria":
        return require("../models/characterModel");
      case "vtm":
        return require("../models/characterVtmModel");
      default:
        throw new Error(`Système de jeu inconnu : "${gameSystem}"`);
    }
  };
  