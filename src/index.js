require("dotenv/config");

const express = require("express");
const PORT = 3000;
const app = express();
const GameController = require("./controllers/GameController");

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Meus favoritos
app.post("/favorite/", GameController.addFavorite);
app.get("/favorite/", GameController.getFavorites);
app.delete("/favorite/:appid", GameController.deleteFavorite);

// Jogos da Steam
app.get("/", GameController.getAll);
app.get("/:id", GameController.getOne);

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});
