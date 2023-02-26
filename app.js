import express from "express";
import path from "path";
import bodyParser from "body-parser";
import { User, Artist, Recommended, Event } from "./models.js";
import {
  getTopArtists,
  getArtistID,
  getRecommended,
  updateEvents,
  populateArtistArray,
} from "./helpers.js";

const app = express();
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

app.get("/", async function (req, res) {
  User.findOne({ username: "jpdesc" }, function (err, foundUser) {
    if (foundUser) {
      if (foundUser.topArtists.length === 0) {
        populateArtistArray(foundUser);
      }
      foundUser.topArtists.forEach((artist) => {
        updateEvents(foundUser._id, artist.id);
        artist.relatedArtists.forEach((relatedArtist) => {
          updateEvents(foundUser._id, relatedArtist.id);
        });
      });
      res.render("index", {
        events: foundUser.events,
      });
    } else {
      const user = new User({
        username: "jpdesc",
        city: "Los Angeles",
        radius: 50,
      });
      user.save();
      res.redirect("/");
    }
  });
});

app.post("/", async function (req, res) {
  res.redirect("/");
});

app.get("/customize", async function (req, res) {
  res.redirect("/");
});

app.post("/customize", async function (req, res) {
  res.redirect("/");
});

app.listen(3000, function () {
  console.log("server is running on port 3000");
});
