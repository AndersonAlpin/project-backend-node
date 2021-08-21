const axios = require("axios");
const URL_ALL_GAMES =
  "https://api.steampowered.com/ISteamApps/GetAppList/v0002/?format=json";
const URL_ONE_GAME = "https://store.steampowered.com/api/appdetails?appids=";
const GameRepository = require("../repositories/GameRepository");

const { join } = require("path");
const filename = join(__dirname, "../../database", "data.json");
const gameRepository = new GameRepository({
  file: filename,
});

class GameController {
  async getAll(req, res) {
    await axios
      .get(URL_ALL_GAMES)
      .then((data) => {
        res.send(data.data.applist.apps);
      })
      .catch((error) => {
        res.json({ error });
      });
  }

  async getOne(req, res) {
    let id = req.params.id;
    await axios
      .get(`${URL_ONE_GAME}${id}`)
      .then((data) => {
        res.send(data.data);
      })
      .catch((error) => {
        res.json({ error });
      });
  }

  async addFavorite(req, res) {
    let { id, rating } = req.body;
    let { email } = req.headers;
    let user = {
      email,
    };

    if (!id) {
      return res.json({ msg: "Por favor, insira um ID válido." });
    }

    if (rating < 0 || rating > 5) {
      return res.json({ msg: "Por favor, insira uma nota entre 0 e 5." });
    }

    let data = await axios.get(`${URL_ONE_GAME}${id}`);
    let newFavorite = data.data;

    newFavorite.rating = rating;
    user.favorites = newFavorite;

    await gameRepository.addFavorite(user);
    res.json({ user });
  }

  async getFavorites(req, res) {
    let { email } = req.headers;

    if (!email) {
      return res.json({ msg: "Você precisa especificar um email no header." });
    }

    let favorites = await gameRepository.getFavorites(email);

    if (favorites.length === 0) {
      return res.json({ msg: "Nenhum dado encontrado." });
    }

    res.json({ favorites });
  }

  async deleteFavorite(req, res) {
    let appid = req.params.appid;

    if (isNaN(appid)) {
      return res.json({
        msg: "Por favor, insira um ID válido.",
      });
    }

    let favoriteDeleted = await gameRepository.deleteFavorite(appid);

    if (!favoriteDeleted) {
      return res.json({ msg: "Estes dados não existem." });
    }

    return res.json({ favoriteDeleted });
  }
}

module.exports = new GameController();
