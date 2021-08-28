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
      await myCache.set("games", games);
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

      // Busca um jogo na steam, retorna para o usuário e salva no cache
      let data = await axios.get(`${URL_ONE_GAME}${id}`);
      game = data.data;

      res.send(game);
      await myCache.set(`game-${id}`, game);
    } catch (error) {
      res.status(404).send("Erro na comunicação com o servidor.");
    }
  }

  async addFavorite(req, res) {
    try {
      let { appid, rating } = req.body;
      let user_hash = req.headers["user-hash"];
      res.set("user-hash", user_hash);

      // Busca um usuário/jogo favorito no banco e busca um jogo no cache
      let user = await User.findOne({ user_hash });
      let game = await myCache.get(`game-${appid}`);
      let gameFavorite = await Game.findOne({ user_id: user._id, appid });

      // Verifica se o jogo existe no cache, caso contrário busca na steam e salva no cache
      if (game) {
        game.rating = rating;
        game.appid = appid;
      } else {
        let data = await axios.get(`${URL_ONE_GAME}${appid}`);
        game = data.data;
        game.rating = rating;
        game.appid = appid;
      }

      // Verifica se o usuário existe
      if (user) {
        // Verifica se o game existe no banco de dados
        if (gameFavorite) {
          // Retorna o jogo existente nos favoritos
          return res.send(gameFavorite);
        } else {
          // Salva o jogo nos favoritos do usuário existente
          game.user_id = user._id;
          let newFavorite = await Game.create(game);
          return res.send(newFavorite);
        }
      } else {
        // Cria um novo usuário e salva o jogos nos favoritos
        let newUser = await User.create({ user_hash });
        game.user_id = newUser._id;
        let newFavorite = await Game.create(game);
        return res.send(newFavorite);
      }
    } catch (error) {
      res.status(400).send("Dados inválidos");
    }
  }

  async getFavorites(req, res) {
    try {
      let user_hash = req.headers["user-hash"];
      res.set("user-hash", user_hash);

      // Busca os jogos de um determinado usuário e retorna para o usuário
      let user = await User.findOne({ user_hash });
      let favorites = await Game.find({ user_id: user._id });

      res.send(favorites);
    } catch (error) {
      res.send([]);
    }
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
