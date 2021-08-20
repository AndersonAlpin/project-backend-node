class GameController {
  async getAll(req, res) {
    res.json({ result: "OK" });
  }
}

module.exports = new GameController();
