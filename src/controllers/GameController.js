const axios = require("axios");
const URL_ALL_GAMES =
  "https://api.steampowered.com/ISteamApps/GetAppList/v0002/?format=json";

class GameController {
  async getAll(req, res) {
    axios
      .get(URL_ALL_GAMES)
      .then((data) => {
        res.send(data.data.applist.apps);
      })
      .catch((error) => {
        res.json({ error });
      });
  }
}

module.exports = new GameController();
