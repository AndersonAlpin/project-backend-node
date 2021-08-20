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
    const favorite = req.body;
    await gameRepository.addFavorite(favorite);
    res.json({ favorite });
  }
}

module.exports = new GameController();
