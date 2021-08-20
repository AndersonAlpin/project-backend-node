const express = require("express");
const PORT = 3000;
const app = express();
const router = require("./routes/index");

app.get('/favicon.ico', function(req, res) { 
  res.status(204);
  res.end();    
});

app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use("/", router);

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});
