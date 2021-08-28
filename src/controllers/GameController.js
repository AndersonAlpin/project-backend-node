const axios = require("axios");
const NodeCache = require("node-cache");
const myCache = new NodeCache();

const { User, Game } = require("../database/mongoose");
const URL_ALL_GAMES =
  "https://simple-api-selection.herokuapp.com/list-games/?title=champions";
const URL_ONE_GAME = "https://store.steampowered.com/api/appdetails?appids=";

class GameController {
  async getAll(req, res) {
    try {
      // Verifica se o jogo existe no cache e retorna para o usuário
      let games = await myCache.get("games");

      if (games) {
        return res.send(games);
      }

      // Busca um jogo na steam, retorna para o usuário e salva no cache
      let data = await axios.get(URL_ALL_GAMES);
      games = data.data.applist.apps.app;

      res.send(games);
      myCache.set("games", games);
    } catch (error) {
      res.status(404).send("Erro na comunicação com o servidor.");
    }
  }

  async getOne(req, res) {
    try {
      // Verifica se o jogo existe no cache e retorna para o usuário
      let id = req.params.id;
      let game = await myCache.get(`game-${id}`);

      if (game) {
        return res.send(game);
      }

      let data = await axios.get(`${URL_ONE_GAME}${id}`);
      game = data.data;

      res.send(game);
      myCache.set(`game-${id}`, game);
    } catch (error) {
      res.status(404).send("Erro na comunicação com o servidor.");
    }
  }

  async addFavorite(req, res) {
    let user_hash = req.headers["user-hash"];
    res.set("user-hash", user_hash);
    let { appid, rating } = req.body;

    try {
      // BUSCA DE UM USUÁRIO
      let user = await User.findOne({ user_hash });

      // VERIFICA SE O FAVORITO JÁ ESTÁ CADASTRADO
      if (user) {
        let gameFavorite = await Game.findOne({ user_id: user._id, appid });

        if (gameFavorite) {
          return res.send(gameFavorite);
        }
      }

      // VERIFICA SE POSSUI O JOGO NO CACHE ANTES DE BUSCAR NA STEAM
      let data = await getCache(`id-${appid}`);
      let game = JSON.parse(data);

      if (!game) {
        let data = await axios.get(`${URL_ONE_GAME}${appid}`);
        game = data.data;
        await setCache(`id-${appid}`, JSON.stringify(game));
      }

      game.rating = rating;
      game.appid = appid;

      // ADICIONA FAVORITO NO USUÁRIO EXISTENTE
      if (user && game) {
        game.user_id = user._id;
        let newFavorite = await Game.create(game);
        return res.send(newFavorite);
      }

      // ADICIONA UM NOVO USUÁRIO ANTES DE INSERIR UM FAVORITO
      let newUser = await User.create({
        user_hash,
      });

      game.user_id = newUser._id;
      let newFavorite = await Game.create(game);
      return res.send(newFavorite);
    } catch (error) {
      res.send([]);
    }
  }

  async getFavorites(req, res) {
    let user_hash = req.headers["user-hash"];
    res.set("user-hash", user_hash);

    let user = await User.findOne({ user_hash });

    if (user) {
      let favorites = await Game.find({ user_id: user._id });
      return res.send(favorites);
    }

    res.send([]);
  }

  async deleteFavorite(req, res) {
    let user_hash = req.headers["user-hash"];
    res.set("user-hash", user_hash);
    let appid = req.params.appid;

    let user = await User.findOne({ user_hash });

    if (user) {
      let gameFavorite = await Game.findOne({ user_id: user._id, appid });
      await Game.deleteOne(gameFavorite);
      return res.send(gameFavorite);
    }

    res.send();
  }
}

module.exports = new GameController();
