const axios = require("axios");
const redis = require("redis");
const User = require("../models/User");
const Game = require("../models/Game");

const URL_ALL_GAMES =
  "https://api.steampowered.com/ISteamApps/GetAppList/v0002/?format=json";
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
    const games = await getCache("games");

    if (games) {
      return res.send(JSON.parse(games));
    }

    try {
      const data = await axios.get(URL_ALL_GAMES);
      const games = data.data.applist.apps;

      res.json({ games });
      await setCache("games", JSON.stringify(games));
    } catch (error) {
      return res.status(500).send({
        message:
          "Erro na comunicação com o servidor da steam. Verifique se você digitou a url corretamente",
      });
    }
  }

  async getOne(req, res) {
    const id = req.params.id;

    const game = await getCache(`id-${id}`);

    if (game) {
      return res.send(JSON.parse(game));
    }

    try {
      const data = await axios.get(`${URL_ONE_GAME}${id}`);
      const game = data.data;

      res.json({ game });
      await setCache(`id-${id}`, JSON.stringify(game));
    } catch (error) {
      return res.status(500).send({
        message:
          "Erro na comunicação com o servidor da steam. Verifique se você digitou a url corretamente",
      });
    }
  }

  async addFavorite(req, res) {
    let user_hash = req.headers.user_hash;
    let { appid, rating } = req.body;
    let errors = [];

    // VALIDAÇÕES
    if (isNaN(appid)) {
      errors.push({ appid: "O campo appid precisa ser um número" });
    }

    if (!rating || rating < 0 || rating > 5) {
      errors.push({ rating: "A nota deve ser um valor entre 0 e 5." });
    }

    if (!isNaN(user_hash) || user_hash.length < 3) {
      errors.push({
        user_hash: "Seu usuário precisa ter no mínimo 3 dígitos.",
      });
    }

    if (errors.length > 0) {
      return res.json({ errors });
    }

    try {
      // BUSCA DE UM USUÁRIO
      let user = await User.findOne({ user_hash });

      // VERIFICA SE O FAVORITO JÁ ESTÁ CADASTRADO
      if (user) {
        let gameFavorite = await Game.findOne({ user_id: user._id, appid });

        if (gameFavorite) {
          return res
            .status(409)
            .send({ message: "Este jogo já esta salvo nos favoritos." });
        }
      }

      // BUSCA UM GAME NO SERVIDOR
      let data = await axios.get(`${URL_ONE_GAME}${appid}`);
      let game = data.data;
      game.rating = rating;
      game.appid = appid;

      // ADICIONA FAVORITO NO USUÁRIO EXISTENTE
      if (user) {
        game.user_id = user._id;
        let newFavorite = await Game.create(game);
        return res.json({ newFavorite });
      }

      // ADICIONA UM NOVO USUÁRIO ANTES DE INSERIR UM FAVORITO
      let newUser = await User.create({
        user_hash,
      });

      game.user_id = newUser._id;
      let newFavorite = await Game.create(game);
      return res.json({ newFavorite });
    } catch (error) {
      return res
        .status(500)
        .send({ error: "Erro na comunicação com o banco de dados." });
    }
  }

  async getFavorites(req, res) {
    let user_hash = req.headers.user_hash;

    try {
      // BUSCA DE UM USUÁRIO
      let user = await User.findOne({ user_hash });

      if (!user) {
        return res.json({ message: "Este usuário não existe." });
      }

      // RETORNA A LISTA DE FAVORITOS
      let favorites = await Game.find({ user_id: user._id });
      return res.json({ favorites });
    } catch (error) {
      return res
        .status(500)
        .send({ error: "Erro na comunicação com o banco de dados." });
    }
  }

  async deleteFavorite(req, res) {
    let user_hash = req.headers.user_hash;
    let appid = req.params.appid;

    try {
      // BUSCA DE UM USUÁRIO
      let user = await User.findOne({ user_hash });

      if (!user) {
        return res.json({ message: "Este usuário não existe." });
      }

      // VERIFICA SE O FAVORITO EXISTE ANTES DE TENTAR DELETÁ-LO
      let gameFavorite = await Game.findOne({ user_id: user._id, appid });
      if (!gameFavorite) {
        return res.status(404).send({ message: "Este jogo não existe." });
      }

      await Game.deleteOne(gameFavorite);
      return res.send({ message: "Jogo deletado com sucesso." });
    } catch (error) {
      return res
        .status(500)
        .send({ error: "Erro na comunicação com o banco de dados." });
    }
  }
}

module.exports = new GameController();
