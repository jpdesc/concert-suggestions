//jshint esversion:6
import passport from "./models.js";
import express from "express";
import bodyParser from "body-parser";
import session from "express-session";
import passport from "passport";

export const appInstantiate = () => {
  const app = express();
  app.use(express.static("public"));
  app.set("view engine", "ejs");
  app.use(
    bodyParser.urlencoded({
      extended: true,
    })
  );

  app.use(
    session({
      secret: "Our little secret.",
      resave: false,
      saveUninitialized: false,
    })
  );

  app.use(passport.initialize());
  app.use(passport.session());

  return app;
};
