const express = require("express");
const router = express.Router();
const GameController = require("../controllers/GameController");

// Meus favoritos
router.post("/favorite/", GameController.addFavorite);

// Jogos da Steam
router.get("/", GameController.getAll);
router.get("/:id", GameController.getOne);

module.exports = router;
