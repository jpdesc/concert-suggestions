import express from "express";
import bodyParser from "body-parser";
import https from "https";
import { getTopArtists, getTopArtistsArray } from "./helpers.js";

const app = express();
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

const topArtists = {};

app.get("/", async function (req, res) {
  const response = await getTopArtists();
  const { items } = await response.json();
  for (let idx in items) {
    let obj = items[idx];
    //   console.log(obj["name"]);

    topArtists[idx] = obj["name"];
    let bandsintown;
  }
  let topArtistsArray = getTopArtistsArray(topArtists);

  res.render("index", { topArtistsArray: topArtistsArray });

  //   const artists = items.slice(0, 10).map((track) => ({
  //     artist: track.artists.map((_artist) => _artist.name).join(", "),
  //     songUrl: track.external_urls.spotify,
  //     title: track.name,
  //   }));
  //   console.log(res);
});

app.listen(3000, function () {
  console.log("server is running on port 3000");
});
