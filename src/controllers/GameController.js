const axios = require("axios");
const bcrypt = require("bcrypt");
const User = require("../models/User");
const Game = require("../models/Game");

const URL_ALL_GAMES =
  "https://api.steampowered.com/ISteamApps/GetAppList/v0002/?format=json";
const URL_ONE_GAME = "https://store.steampowered.com/api/appdetails?appids=";
const emailRegex =
  /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

class GameController {
  async getAll(req, res) {
    await axios
      .get(URL_ALL_GAMES)
      .then((data) => {
        res.send(data.data.applist.apps);
      })
      .catch((error) => {
        return res.status(500).send({
          message:
            "Erro na comunicação com o servidor da steam. Verifique se você digitou a url corretamente",
        });
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
        return res.status(500).send({
          message:
            "Erro na comunicação com o servidor da steam. Verifique se você digitou a url corretamente",
        });
      });
  }

  async addFavorite(req, res) {
    let { appid, rating } = req.body;
    let user_hash = req.headers.user_hash;
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
