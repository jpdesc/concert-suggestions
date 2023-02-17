import express from "express";
import bodyParser from "body-parser";
import cookieParser from "cookie-parser";
import https from "https";
import {
  getTopArtists,
  getTopArtistsArray,
  getEvents,
  formatEvents,
  getArtistID,
  getGeocoding,
} from "./helpers.js";

const app = express();
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

var topArtists = {};
var concertInfo = {};
var topArtistsArray = [];

app.get("/", async function (req, res) {
  res.render("index", {
    topArtistsArray: topArtistsArray,
    topArtists: topArtists,
  });
});

app.post("/", async function (req, res) {
  topArtists = {};
  topArtistsArray = [];
  let timeRange = req.body.range;
  let limit = req.body.quantity;
  let radius = req.body.radius;
  let city = req.body.location;
  const response = await getTopArtists(timeRange, limit);
  const { items } = await response.json();
  for (let idx in items) {
    let artistObj = items[idx];
    var artistName = artistObj["name"];
    var id = await getArtistID(artistName);
    topArtists[idx] = {
      artist: artistName,
      eventInfo: await formatEvents(id, city, radius),
      id: id,
      image: artistObj.images[0].url,
    };
  }
  //   console.log(topArtists);
  res.redirect("/");
});

app.listen(3000, function () {
  console.log("server is running on port 3000");
});
