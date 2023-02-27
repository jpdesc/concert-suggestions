import mongoose from "mongoose";

mongoose.connect("mongodb://localhost:27017/concert-genie", {
  useNewUrlParser: true,
});
const eventSchema = new mongoose.Schema({
  title: String,
  date: String,
  tickets: String,
  time: String,
  venue: String,
  location: String,
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
  city: String,
  radius: Number,
  lastUpdate: String,
  topArtists: [artistSchema],
  events: [eventSchema],
});

export const User = mongoose.model("User", userSchema);
export const Artist = mongoose.model("Artist", artistSchema);
export const Recommended = mongoose.model("Recommended", relatedArtistSchema);
export const Event = mongoose.model("Event", eventSchema);
