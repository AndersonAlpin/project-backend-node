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

  async getFavorites(email) {
    const files = await this._currentFile();
    let favorites = [];

    files.forEach((file) => {
      if (file.email === email) {
        favorites.push(file);
      }
    });

    return favorites;
  }

  async deleteFavorite(email, id) {
    const files = await this._currentFile();
    let fileDeleted = "";

    files.forEach((file, index) => {
      if (file.email === email && file[id]) {
        files.splice(index, 1);
        fileDeleted = file;
      }
    });

    await writeFile(this.file, JSON.stringify(files));

    return fileDeleted;
  }
}

module.exports = GameRepository;
