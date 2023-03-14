import express from "express";
import bodyParser from "body-parser";
import dayjs from "dayjs";
import passport from "passport";
import * as dotenv from "dotenv";
import { User, Artist, Recommended, Event } from "./models.js";
import {
  updateEvents,
  populateArtistArray,
  getGeolocation,
  delay,
  getUserEvents,
  getUser,
} from "./helpers.js";

import { app } from "./models.js";

dotenv.config();

app.get("/", async function (req, res) {
  if (!req.user) {
    res.redirect("/login");
  } else {
    User.findOne({ username: req.user.username }).then((user) => {
      console.log(user.events);
      if (user.events.length > 0) {
        res.render("index", { events: user.events });
      }
    });
  }
});

app.get("/analyze", async function (req, res) {
  console.log(`req.user = ${req.user}`);
  if (req.user) {
    const username = req.user.username;
    console.log(req.user._id);
    console.log("authenticated");
    User.findOne({ username: username })
      .then(async (user) => {
        if (user.topArtists.length === 0) {
          return await populateArtistArray(user);
        }
        return user;
      })
      .then(async (user) => {
        // console.log(`inside middle promise ${user}`);
        var eventRefresh = await dayjs().isAfter(user.nextUpdate);
        return await getUserEvents(user._id, eventRefresh);
      })
      .then(async (user) => {
        await user;
        res.redirect("/");
      });
  } else {
    res.redirect("/login");
  }
});

app.get("/customize", async function (req, res) {
  res.render("analyze");
  User.findOne({ username: "jpdesc" }, function (err, foundUser) {
    if (!err) {
      res.render("customize", { artists: foundUser.topArtists });
    } else {
      console.log(err);
      res.redirect("/");
    }
  });
});

app.get("/updateInfo", async function (req, res) {
  if (typeof req.user.city === "undefined") {
    // console.log(req.user);
    res.render("updateInfo", { user: req.user });
  } else {
    // console.log(req.user);
    console.log("");
    res.redirect("/analyze");
  }
});

app.post("/updateInfo", async function (req, res) {
  const city = req.body.city;
  const radius = req.body.radius;
  getGeolocation(req.user.username, city, radius);
  res.redirect("/analyze");
});

app.post("/customize", async function (req, res) {
  res.redirect("/");
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
      res.redirect("/login");
    } else {
      console.log("logged in");
      passport.authenticate("local", {
        failureRedirect: "/login",
        failureMessage: true,
      })(req, res, function () {
        res.redirect("/updateInfo");
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
          res.redirect("/updateInfo");
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
    res.redirect("/updateInfo");
  }
);

app.post("/logout", function (req, res, next) {
  req.logout(function (err) {
    if (err) {
      return next(err);
    }
    res.redirect("/");
  });
});

app.listen(3000, function () {
  console.log("server is running on port 3000");
});
