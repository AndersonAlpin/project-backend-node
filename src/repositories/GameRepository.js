const { readFile, writeFile } = require("fs/promises");

class GameRepository {
  constructor({ file }) {
    this.file = file;
  }

  async _currentFile() {
    return JSON.parse(await readFile(this.file));
  }

  async addFavorite(data) {
    const currentFile = await this._currentFile();
    currentFile.push(data);

    await writeFile(this.file, JSON.stringify(currentFile));

    return data;
  }

  async getFavorites() {
    return await this._currentFile();
  }
}

module.exports = GameRepository;
