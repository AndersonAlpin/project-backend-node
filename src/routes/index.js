const express = require("express");
const router = express.Router();
const GameController = require("../controllers/GameController");

router.get("/", GameController.getAll);

module.exports = router;
