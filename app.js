import express from "express";
import bodyParser from "body-parser";
import cookieParser from "cookie-parser";
import https from "https";
import { getTopArtists, getTopArtistsArray, getEvents } from "./helpers.js";

const app = express();
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

var topArtists = {};
var concertInfo = {};
var topArtistsArray = [];

app.get("/", async function (req, res) {
  console.log(typeof topArtists);
  res.render("index", {
    topArtistsArray: topArtistsArray,
    topArtists: topArtists,
  });
});

app.post("/", async function (req, res) {
  topArtists = {};
  topArtistsArray = [];
  let time_range = req.body.range;
  let limit = req.body.quantity;
  const response = await getTopArtists(time_range, limit);
  const { items } = await response.json();
  for (let idx in items) {
    // console.log(Number(idx));
    let artistObj = items[idx];
    let artist = artistObj["name"];
    topArtists[idx] = {
      artist: artist,
      events: await getEvents(artist),
    };
  }
  console.log(topArtists[1]);

  res.redirect("/");
});

app.listen(3000, function () {
  console.log("server is running on port 3000");
});
