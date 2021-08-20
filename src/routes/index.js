const express = require("express");
const router = express.Router();
const GameController = require("../controllers/GameController");

router.get("/", GameController.getAll);
router.get("/:id", GameController.getOne);

module.exports = router;
