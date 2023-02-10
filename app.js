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
  res.render("index", { topArtistsArray: topArtistsArray });
});

app.post("/", async function (req, res) {
  const response = await getTopArtists();
  const { items } = await response.json();
  for (let idx in items) {
    let obj = items[idx];
    //   console.log(obj["name"]);
    topArtists[idx] = obj["name"];
  }
  let topArtistsArray = getTopArtistsArray(topArtists);
  res.redirect("/");
});

app.listen(3000, function () {
  console.log("server is running on port 3000");
});
