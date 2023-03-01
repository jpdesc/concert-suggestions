import express from "express";
import bodyParser from "body-parser";
import moment from "moment";

import passport from "passport";
import * as dotenv from "dotenv";
import { User, Artist, Recommended, Event } from "./models.js";
import { updateEvents, populateArtistArray } from "./helpers.js";

import { app } from "./models.js";

dotenv.config();

app.get("/", async function (req, res) {
  //   console.log(req.body);
  if (req.user) {
    console.log("authenticated");
    User.findOne({ username: req.user.username }, function (err, foundUser) {
      if (foundUser) {
        if (foundUser.topArtists.length === 0) {
          populateArtistArray(foundUser);
        }
        var lastUpdateDelta = moment().diff(
          moment(foundUser.lastUpdate),
          "days"
        );
        if (foundUser.events.length === 0 || lastUpdateDelta > 5) {
          foundUser.events = [];

          foundUser.topArtists.forEach((artist) => {
            setTimeout(updateEvents, 201, foundUser._id, artist.id); // setTimeout needed to prevent API rate violations.
            artist.relatedArtists.forEach((relatedArtist) => {
              setTimeout(updateEvents, 201, foundUser._id, relatedArtist.id);
            });
          });
          //   console.log(foundUser.events);
          foundUser.save();
          res.render("index", {
            events: foundUser.events,
          });
        }
      } else {
        res.redirect("/login");
      }
    });
  } else {
    res.redirect("/login");
  }
});

app.post("/", async function (req, res) {
  const updatedRadius = req.body.radius;
  const updatedCity = req.body.radius;
  //   console.log(req.body.user);
  res.redirect("/");
});

app.get("/customize", async function (req, res) {
  User.findOne({ username: "jpdesc" }, function (err, foundUser) {
    if (!err) {
      res.render("customize", { artists: foundUser.topArtists });
    } else {
      console.log(err);
      res.redirect("/");
    }
  });
});

app.post("/customize", async function (req, res) {
  res.redirect("/");
});

app.get("/home", function (req, res) {
  res.render("home");
});

app.get("/login", function (req, res) {
  res.render("login");
});

app.post("/login", function (req, res) {
  const user = new User({
    username: req.body.username,
    password: req.body.password,
  });
  //   console.log(user);
  req.login(user, function (err) {
    if (err) {
      console.log("not working!!!!");
      console.log(`err = ${err}`);
      res.redirect("/login");
    } else {
      console.log("logged in");
      passport.authenticate("local", {
        failureRedirect: "/login",
        failureMessage: true,
      })(req, res, function () {
        res.redirect("/");
      });
    }
  });
});

app.get("/register", function (req, res) {
  res.render("register");
});

app.post("/register", function (req, res) {
  User.register(
    { username: req.body.username },
    req.body.password,
    function (err, user) {
      if (err) {
        console.log(`err= ${err}`);
        res.redirect("/register");
      } else {
        passport.authenticate("local")(req, res, function () {
          //   console.log(res.body);
          res.redirect("/");
        });
      }
    }
  );
});

app.get(
  "/auth/google",
  passport.authenticate("google", { scope: ["profile"] })
);

app.get(
  "/auth/google/secrets",
  passport.authenticate("google", { failureRedirect: "/login" }),
  function (req, res) {
    console.log("/auth/google/secrets");
    // Successful authentication, redirect home.
    res.redirect("/");
  }
);

app.listen(3000, function () {
  console.log("server is running on port 3000");
});
