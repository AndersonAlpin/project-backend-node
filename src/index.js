const express = require("express");
const PORT = 3000;
const app = express();
const router = require("./routes/index");

app.use("/", router);

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});
