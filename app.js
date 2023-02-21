import express from "express";
import bodyParser from "body-parser";
import mongoose from "mongoose";
import {
  getTopArtists,
  createArtistObj,
  getArtistID,
  getRecommended,
} from "./helpers.js";

mongoose.connect("mongodb://localhost:27017/concert-genie", {
  useNewUrlParser: true,
});

const userSchema = new mongoose.Schema({
  username: String,
  topArtists: Object,
  recommendedArtists: Object,
});

const User = mongoose.model("User", userSchema);
const user = new User({ username: jpdesc });

const app = express();
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

var topArtists = {};
var recommendedArtists = {};
var eventIndices = { top: [], recommended: [] };

app.get("/", async function (req, res) {
  res.render("index", {
    topArtists: topArtists,
    topArtistsEvents: eventIndices.top,
    recommendedEvents: eventIndices.recommended,
  });
});

app.post("/", async function (req, res) {
  topArtists = {};
  recommendedArtists = {};
  eventIndices = { top: [], recommended: [] };
  var recommendedArray = [];
  let timeRange = req.body.range;
  var limit = req.body.quantity;
  var radius = req.body.radius;
  var city = req.body.location;
  const response = await getTopArtists(timeRange, limit);
  const { items } = await response.json();
  for (let idx in items) {
    var recommendedArray = await getRecommended(artistName, recommendedArray);
    let artistObj = items[idx];
    var artistName = artistObj["name"];
    var id = await getArtistID(artistName);
    var image = artistObj.images[0].url;
    topArtists[idx] = await createArtistObj(
      artistName,
      id,
      city,
      radius,
      image
    );
    if (topArtists[idx].eventInfo[0]) {
      eventIndices.top.push(recommendedArtists[idx]);
    }
  }

  for (let idx in recommendedArray) {
    let artistName = recommendedArray[idx].artist;
    let id = await getArtistID(artistName);
    let image = recommendedArray[idx].image;
    recommendedArtists[idx] = await createArtistObj(
      artistName,
      id,
      city,
      radius,
      image
    );
    if (recommendedArtists[idx].eventInfo[0]) {
      console.log(recommendedArtists[idx]);
      eventIndices.recommended.push(recommendedArtists[idx]);
    }
  }
  res.redirect("/");
});

app.listen(3000, function () {
  console.log("server is running on port 3000");
});
