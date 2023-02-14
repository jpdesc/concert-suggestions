import express from "express";
import bodyParser from "body-parser";
import https from "https";
import { getTopArtists, getTopArtistsArray } from "./helpers.js";

const app = express();
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

const topArtists = {};
const topArtistsArray = [];

app.get("/", async function (req, res) {
  console.log("inside get function");
  res.render("index", { topArtistsArray: topArtistsArray });
});

app.post("/", async function (req, res) {
  console.log(req.body);
  let time_range = req.body.range;
  let limit = req.body.quantity;
  const response = await getTopArtists(time_range, limit);
  console.log(response);
  const { items } = await response.json();
  for (let idx in items) {
    let artistObj = items[idx];
    let artist = artistObj["name"];
    console.log(artist);
    //   console.log(obj["name"]);
    topArtists[idx] = artist;
  }
  let topArtistsArray = getTopArtistsArray(topArtists);
  res.redirect("/");
});

app.listen(3000, function () {
  console.log("server is running on port 3000");
});
