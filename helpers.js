import * as dotenv from "dotenv";
import { User, Artist, Recommended, Event } from "./models.js";
import dayjs from "dayjs";
import Bottleneck from "bottleneck";
dotenv.config();
import querystring from "querystring";

const limiter = new Bottleneck({
  maxConcurrent: 1,
  minTime: 200,
});

const client_id = process.env.CLIENT_ID;
const client_secret = process.env.CLIENT_SECRET;
const refresh_token = process.env.REFRESH_TOKEN;
const ticketmaster_api_key = process.env.TICKETMASTER_API_KEY;
const LASTFM_API_KEY = process.env.LASTFM_API_KEY;
const SEATGEEK_CLIENT_SECRET = process.env.SEATGEEK_CLIENT_SECRET;
const SEATGEEK_CLIENT_ID = process.env.SEATGEEK_CLIENT_ID;
const OPENWEATHER_API_KEY = process.env.OPENWEATHER_API_KEY;

const basic = Buffer.from(`${client_id}:${client_secret}`).toString("base64");
const TOKEN_ENDPOINT = `https://accounts.spotify.com/api/token`;

const TOP_ARTISTS_BASE_ENDPOINT = `https://api.spotify.com/v1/me/top/artists/?`;
const TICKETMASTER_BASE_ENDPOINT =
  "https://app.ticketmaster.com/discovery/v2/events.json?apikey=" +
  ticketmaster_api_key;

const ARTIST_INFO_ENDPOINT =
  "https://app.ticketmaster.com/discovery/v2/attractions.json?apikey=" +
  ticketmaster_api_key;

const LASTFM_BASE_ENDPOINT =
  "https://ws.audioscrobbler.com/2.0/?method=artist.getsimilar&artist=";
const LASTFM_SUFFIX = "&format=json";

const SEATGEEK_EVENTS_BASE = `https://api.seatgeek.com/2/events?client_id=${SEATGEEK_CLIENT_ID}&client_secret=${SEATGEEK_CLIENT_SECRET}`;

const OPENWEATHER_GEOLOCATION_BASE =
  "http://api.openweathermap.org/geo/1.0/direct?q=";
const OPENWEATHER_SUFFIX = "&appid=" + OPENWEATHER_API_KEY;

const getAccessToken = async () => {
  const response = await fetch(TOKEN_ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: `Basic ${basic}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: querystring.stringify({
      grant_type: "refresh_token",
      refresh_token,
    }),
  });
  return response.json();
};

const setTimeoutPromise = (timeout) =>
  new Promise((resolve) => {
    setTimeout(resolve, timeout);
  });

export const getGeolocationResponse = async (city) => {
  const GET_GEOLOCATION_ENDPOINT =
    OPENWEATHER_GEOLOCATION_BASE + city + OPENWEATHER_SUFFIX;
  return fetch(GET_GEOLOCATION_ENDPOINT);
};

export const getGeolocation = async (username, city, radius) => {
  const geolocationResponse = await getGeolocationResponse(city);
  const geolocationJSON = await geolocationResponse.json();
  console.log(geolocationJSON);
  const lat = geolocationJSON[0].lat;
  const lon = geolocationJSON[0].lon;
  User.updateOne(
    { username: username },
    {
      $set: {
        city: city,
        lat: lat,
        lon: lon,
        radius: radius,
      },
    },
    function (err, foundUser) {
      if (err) {
        console.log(err);
      } else {
        console.log("updated");
      }
    }
  );
};

export const getTopArtists = async (time_range, limit) => {
  const { access_token } = await getAccessToken();
  time_range = `time_range=${time_range}`;
  limit =
    limit && !time_range
      ? `limit=${limit}`
      : limit && time_range
      ? `&limit=${limit}`
      : "";
  const TOP_ARTISTS_ENDPOINT = TOP_ARTISTS_BASE_ENDPOINT + time_range + limit;
  return fetch(TOP_ARTISTS_ENDPOINT, {
    headers: {
      Authorization: `Bearer ${access_token}`,
    },
  });
};

export const getTopArtistsArray = (topArtistsObj) => {
  let topArtistsArray = [];
  for (let i in topArtistsObj) {
    topArtistsArray.push(topArtistsObj[i]);
  }
  return topArtistsArray;
};

export const eventsResponse = async (id, city, radius) => {
  if (radius === "None") {
    var radius = 50;
  }
  const LOCATION_STRING = city ? `&city=${city}&radius=${radius}` : "";
  const GET_EVENTS_ENDPOINT =
    TICKETMASTER_BASE_ENDPOINT + "&attractionId=" + id + LOCATION_STRING;
  return fetch(GET_EVENTS_ENDPOINT);
};

export const getEvents = async (id, city, radius) => {
  let response = await eventsResponse(id, city, radius);
  console.log(response);
  let eventsJSON = await response.json();
  console.log(eventsJSON);
  let parsedEvents = eventsJSON._embedded;
  let eventsArr = [];
  var max = parsedEvents ? parsedEvents.events.length : 0;
  for (let i = 0; i < max; i++) {
    await eventsArr.push(parsedEvents.events[i]);
  }
  return eventsArr;
};

// export const seatgeekEventsResponse = (lat, lon, artistName) => {
//   const artistURL = `&performers.slug=${artistName}`;
// };

const getPrettyPrinted = (jsonObj) => {
  var jsonEventPretty = JSON.stringify(jsonObj, null, 2);
  return jsonEventPretty;
};

export const getUser = async (userId) => {
  const foundUser = await User.findOne({ _id: userId });
  return foundUser;
};

const convertDate = async (date) => {
  const formattedDate = await dayjs(date).format("dddd, MMMM D, YYYY");
  return formattedDate;
};

const convertTime = async (date, time) => {
  const dateTime = date + time;
  const formattedTime = await dayjs(dateTime).format("h:mm A");
  return formattedTime;
};

export const updateEvents = async (userId, artistId, type) => {
  console.log(type);
  const user = await getUser(userId);
  await limiter
    .schedule(() => getEvents(artistId, user.city, user.radius))
    .then((events) => {
      events.forEach(async (event) => {
        // console.log(event.name);
        const eventObj = new Event({
          title: event.name,
          date: await convertDate(event.dates.start.localDate),
          tickets: event.url,
          time: await convertTime(
            event.dates.start.localDate,
            event.dates.start.localTime
          ),
          venue: event._embedded.venues[0].name,
          location: event._embedded,
          image: event.images[0].url,
          genre: event.classifications[0].genre.name,
        });
        await user.events.push(eventObj);
      });
    });

  await user.save();
};

export const delay = async () => {
  return await setTimeout(() => {}, 200);
};

export const getUserEvents = async (userId, eventRefresh) => {
  const user = await getUser(userId);
  if (user.events.length === 0 || eventRefresh) {
    console.log("updating events");
    user.nextUpdate = await dayjs().add(5, "day");
    user.events = [];
    await user.topArtists.forEach(async (artist) => {
      await updateEvents(user._id, artist.id, "top artists"); // setTimeout needed to prevent API rate violations.
      await artist.relatedArtists.forEach(async (relatedArtist) => {
        await updateEvents(user._id, relatedArtist.id, "related");
      });
    });
    await user.save();
  }
  return user;
};

const attractionResponse = (artist) => {
  const ATTRACTION_ENDPOINT = ARTIST_INFO_ENDPOINT + "&keyword=" + artist;
  return fetch(ATTRACTION_ENDPOINT);
};

export const getArtistID = async (artist) => {
  let response = await attractionResponse(artist);
  let artistJSON = await response.json();
  //   console.log(artistJSON);
  let id = artistJSON._embedded ? artistJSON._embedded.attractions[0].id : null;

  return id;
};

export const createRecommendedArr = async (artistsObj) => {
  let topArtistsArray = await getTopArtistsArray(artistsObj);
  for (let idx in topArtistsArray) {
    let recommended = getRecommended(topArtists[idx]);
  }
};

const lastfmResponse = (artist) => {
  const LASTFM_ENDPOINT =
    LASTFM_BASE_ENDPOINT +
    artist +
    "&api_key=" +
    LASTFM_API_KEY +
    LASTFM_SUFFIX;
  //   console.log(LASTFM_ENDPOINT);
  return fetch(LASTFM_ENDPOINT);
};

export const getRecommended = async (artistName) => {
  const related = [];
  let response = await lastfmResponse(artistName);
  let lastfmJSON = await response.json();
  let recommendedArtists = lastfmJSON.similarartists;
  for (let i = 0; i < 5; i++) {
    try {
      if (recommendedArtists.artist[i]) {
        const recommendedName = recommendedArtists.artist[i].name;
        // console.log(recommendedName);
        const recommendedArtist = new Recommended({
          artist: recommendedName,
          image: recommendedArtists.artist[i].image[0]["#text"],
          id: await getArtistID(recommendedName),
        });
        related.push(recommendedArtist);
      }
    } catch (err) {
      console.log(err);
    }
  }
  return related;
};

export const populateArtistArray = async (user) => {
  const response = await getTopArtists("long_term", 50);
  const { items } = await response.json();
  for (let i in items) {
    const artistObj = items[i];
    const artistName = artistObj["name"];
    var artist = new Artist({
      artist: artistName,
      id: await getArtistID(artistName),
      image: artistObj.images[0].url,
    });
    console.log(artist);
    // console.log(artist.id);
    let relatedArtists = await getRecommended(artistName);
    relatedArtists.forEach(async (relatedArtist) => {
      await artist.relatedArtists.push(relatedArtist);
    });
    await user.topArtists.push(artist);
    // console.log(user.topArtists);

    // User.updateOne({ _id: user._id }, { $push: { topArtists: artist } });
  }
  await user.save();
  return user;
};
