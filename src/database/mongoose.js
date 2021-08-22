const mongoose = require("mongoose");

mongoose.connect(process.env.URI_MONGODB, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

module.exports = mongoose;