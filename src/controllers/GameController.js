const axios = require("axios");
const redis = require("redis");
const { User, Game } = require("../database/mongoose");

const URL_ALL_GAMES =
  "https://simple-api-selection.herokuapp.com/list-games/?title=champions";
const URL_ONE_GAME = "https://store.steampowered.com/api/appdetails?appids=";

const redisClient = redis.createClient();

const getCache = (key) => {
  return new Promise((resolve, reject) => {
    redisClient.get(key, (err, value) => {
      if (err) {
        reject(err);
      } else {
        resolve(value);
      }
    });
  });
};

const setCache = (key, value) => {
  return new Promise((resolve, reject) => {
    redisClient.set(key, value, "EX", 120, (err) => {
      if (err) {
        reject(err);
      } else {
        resolve(true);
      }
    });
  });
};

class GameController {
  async getAll(req, res) {
    let games = await getCache("games");

    if (games) {
      return res.send(JSON.parse(games));
    }

    let data = await axios.get(URL_ALL_GAMES);
    games = data.data.applist.apps.app;

    res.send(games);
    await setCache("games", JSON.stringify(games));
  }

  async getOne(req, res) {
    let id = req.params.id;
    let game = await getCache(`id-${id}`);

    if (game) {
      return res.send(JSON.parse(game));
    }

    let data = await axios.get(`${URL_ONE_GAME}${id}`);
    game = data.data;

    res.send(game);
    await setCache(`id-${id}`, JSON.stringify(game));
  }

  async addFavorite(req, res) {
    let user_hash = req.headers["user-hash"];
    let { appid, rating } = req.body;

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
    if (user) {
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
  }

  async getFavorites(req, res) {
    let user_hash = req.headers["user-hash"];
    let user = await User.findOne({ user_hash });
    let favorites = await Game.find({ user_id: user._id });

    return res.send(favorites);
  }

  async deleteFavorite(req, res) {
    let user_hash = req.headers["user-hash"];
    let appid = req.params.appid;

    let user = await User.findOne({ user_hash });
    let gameFavorite = await Game.findOne({ user_id: user._id, appid });

    await Game.deleteOne(gameFavorite);
    return res.send(gameFavorite);
  }
}

module.exports = new GameController();
