const axios = require("axios");
const bcrypt = require("bcrypt");
const User = require("../models/User");
const Game = require("../models/Game");

const URL_ALL_GAMES =
  "https://api.steampowered.com/ISteamApps/GetAppList/v0002/?format=json";
const URL_ONE_GAME = "https://store.steampowered.com/api/appdetails?appids=";

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
    let { appid, rating } = req.body;
    let { email, password } = req.headers;
    let isPasswordRight = "";

    // VALIDAÇÃO DE USUÁRIO
    let user = await User.findOne({ email });

    if (user) {
      isPasswordRight = await bcrypt.compare(password, user.password);
    }

    if (user && !isPasswordRight) {
      return res.json({
        message:
          "Senha incorreta. Crie um novo login caso seja o seu primeiro acesso.",
      });
    }

    // VERIFICA SE O FAVORITO JÁ ESTÁ CADASTRADO
    let gameFavorite = await Game.findOne({ appid });
    if (gameFavorite) {
      return res.json({ message: "Este jogo já esta salvo nos favoritos." });
    }

    // BUSCA UM GAME NO SERVIDOR
    if (!appid) {
      return res.json({ msg: "Por favor, insira um ID válido." });
    }

    if (rating < 0 || rating > 5) {
      return res.json({ msg: "Por favor, insira uma nota entre 0 e 5." });
    }

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
    let hash = bcrypt.hashSync(password, 10);
    let newUser = await User.create({
      email,
      password: hash,
    });

    game.user_id = newUser._id;
    let newFavorite = await Game.create(game);
    return res.json({ newFavorite });
  }

  async getFavorites(req, res) {
    let { email, password } = req.headers;
    let isPasswordRight = "";

    // VALIDAÇÃO DE USUÁRIO
    let user = await User.findOne({ email });

    if (user) {
      isPasswordRight = await bcrypt.compare(password, user.password);
    }

    if (user && !isPasswordRight) {
      return res.json({
        message:
          "Senha incorreta. Crie um novo login caso seja o seu primeiro acesso.",
      });
    }

    // RETORNA A LISTA DE FAVORITOS
    let favorites = await Game.find({ user_id: user._id });
    return res.json({ favorites });
  }

  async deleteFavorite(req, res) {
    let appid = req.params.appid;
    let { email, password } = req.headers;
    let isPasswordRight = "";

    if (isNaN(appid)) {
      return res.json({
        msg: "Por favor, insira um ID válido.",
      });
    }

    // VALIDAÇÃO DE USUÁRIO
    let user = await User.findOne({ email });

    if (user) {
      isPasswordRight = await bcrypt.compare(password, user.password);
    }

    if (user && !isPasswordRight) {
      return res.json({
        message:
          "Senha incorreta. Crie um novo login caso seja o seu primeiro acesso.",
      });
    }

    // VERIFICA SE O FAVORITO EXISTE ANTES DE TENTAR DELETÁ-LO
    let gameFavorite = await Game.findOne({ appid });
    if (!gameFavorite) {
      return res.json({ message: "Este jogo não existe." });
    }

    await Game.deleteOne(gameFavorite);
    return res.json({ message: "Jogo deletado com sucesso." });
  }
}

module.exports = new GameController();
