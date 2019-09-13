const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const directorsSchema = new Schema(
  {
    name: String,
    movies: [ { type : Schema.Types.ObjectId, ref: 'Movies' } ]
  },
  { timestamps: true }
);

const Directors = mongoose.model("Directors", directorsSchema);
module.exports = Directors;
