import express from "express";
import bodyParser from "body-parser";
import cookieParser from "cookie-parser";
import https from "https";
import { getTopArtists, getTopArtistsArray } from "./helpers.js";

const app = express();
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

var topArtists = {};
var topArtistsArray = [];

app.get("/", async function (req, res) {
  res.render("index", { topArtistsArray: topArtistsArray });
});

app.post("/", async function (req, res) {
  topArtists = {};
  topArtistsArray = [];
  let time_range = req.body.range;
  let limit = req.body.quantity;
  const response = await getTopArtists(time_range, limit);
  const { items } = await response.json();
  for (let idx in items) {
    let artistObj = items[idx];
    let artist = artistObj["name"];
    topArtists[idx] = artist;
  }
  console.log(topArtists);
  console.log(getTopArtistsArray(topArtists));
  topArtistsArray = getTopArtistsArray(topArtists);
  res.redirect("/");
});

app.listen(3000, function () {
  console.log("server is running on port 3000");
});
