import mongoose from "mongoose";
import passportLocalMongoose from "passport-local-mongoose";
import * as dotenv from "dotenv";
import findOrCreate from "mongoose-findorcreate";
import passport from "passport";
import express from "express";
import bodyParser from "body-parser";
import session from "express-session";
import { fileURLToPath } from "url";
import path from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();
import { Strategy as GoogleStrategy } from "passport-google-oauth20";

const secret = process.env.SECRET;

mongoose.connect("mongodb://localhost:27017/concert-genie", {
  useNewUrlParser: true,
});

// mongoose.set("useCreateIndex", true);
const eventSchema = new mongoose.Schema({
  title: String,
  date: String,
  tickets: String,
  time: String,
  venue: String,
  location: String,
  image: String,
  genre: String,
});

const relatedArtistSchema = new mongoose.Schema({
  artist: String,
  photoUrl: String,
  id: String,
});

const artistSchema = new mongoose.Schema({
  artist: String,
  photoUrl: String,
  id: String,
  relatedArtists: [relatedArtistSchema],
});

const userSchema = new mongoose.Schema({
  username: String,
  googleId: String,
  password: String,
  city: String,
  radius: String,
  lat: String,
  lon: String,
  lastUpdate: String,
  topArtists: [artistSchema],
  events: [eventSchema],
});

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);
const User = mongoose.model("User", userSchema);
passport.use(User.createStrategy());

passport.serializeUser(function (user, done) {
  done(null, user.id);
});

passport.deserializeUser(function (id, done) {
  User.findById(id, function (err, user) {
    done(err, user);
  });
});

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "http://localhost:3000/auth/google/secrets",
      userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo",
    },
    function (accessToken, refreshToken, profile, cb) {
      User.findOrCreate({ googleId: profile.id }, function (err, user) {
        // console.log(user);
        return cb(err, user);
      });
    }
  )
);

const app = express();
app.use(express.static("public"));
app.set("views", __dirname + "/views");
app.set("view engine", "ejs");
app.use(
  bodyParser.urlencoded({
    extended: true,
  })
);

app.use(
  session({
    secret: secret,
    resave: false,
    saveUninitialized: false,
  })
);

app.use(passport.initialize());
app.use(passport.session());

export { User, app };
export const Artist = mongoose.model("Artist", artistSchema);
export const Recommended = mongoose.model("Recommended", relatedArtistSchema);
export const Event = mongoose.model("Event", eventSchema);
