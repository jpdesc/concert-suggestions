import * as dotenv from "dotenv";
dotenv.config();
import querystring from "querystring";
// import topArtistsArray from "app.js";

const client_id = process.env.CLIENT_ID;
const client_secret = process.env.CLIENT_SECRET;
const refresh_token = process.env.REFRESH_TOKEN;
const ticketmaster_api_key = process.env.TICKETMASTER_API_KEY;
const OPENWEATHER_API_KEY = process.env.OPENWEATHER_API_KEY;
const LASTFM_API_KEY = process.env.LASTFM_API_KEY;

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

const OPENWEATHER_BASE_ENDPOINT =
  "https://api.openweathermap.org/geo/1.0/direct?q=";

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

export const eventsResponse = (id, city, radius) => {
  if (radius === "None") {
    var radius = 50;
  }
  const LOCATION_STRING = city ? `&city=${city}&radius=${radius}` : "";
  const GET_EVENTS_ENDPOINT =
    TICKETMASTER_BASE_ENDPOINT + "&attractionId=" + id + LOCATION_STRING;
  console.log(GET_EVENTS_ENDPOINT);
  return fetch(GET_EVENTS_ENDPOINT);
};

export const getEvents = async (id, city, radius) => {
  let response = await eventsResponse(id, city, radius);
  let eventsJSON = await response.json();
  let parsedEvents = eventsJSON._embedded;
  let eventsArr = [];
  var max = parsedEvents ? parsedEvents.events.length : 0;
  for (let i = 0; i < max; i++) {
    console.log(parsedEvents.events[i]);
    eventsArr.push(parsedEvents.events[i]);
  }
  console.log(eventsArr);
  return eventsArr;
};

const getPrettyPrinted = (jsonObj) => {
  var jsonEventPretty = JSON.stringify(jsonObj, null, 2);
  return jsonEventPretty;
};

export const formatEvents = async (id, city, radius) => {
  let events = await getEvents(id, city, radius);
  let eventList = [];
  for (let i in events) {
    let event = events[i];
    let eventObj = {
      title: event.name,
      date: event.dates.start.localDate,
      tickets: event.url,
      time: event.dates.start.localTime,
      venue: event._embedded,
      location: event._embedded,
    };
    eventList.push(eventObj);
  }
  return eventList;
};

const attractionResponse = (artist) => {
  const ATTRACTION_ENDPOINT = ARTIST_INFO_ENDPOINT + "&keyword=" + artist;
  return fetch(ATTRACTION_ENDPOINT);
};

export const getArtistID = async (artist) => {
  let response = await attractionResponse(artist);
  let artistJSON = await response.json();
  let id = artistJSON._embedded ? artistJSON._embedded.attractions[0].id : null;
  return id;
};

const goecodingResponse = (cityName) => {
  const GEOCODING_ENDPOINT =
    OPENWEATHER_BASE_ENDPOINT + cityName + "&appid=" + OPENWEATHER_API_KEY;
  return fetch(GEOCODING_ENDPOINT);
};

export const getGeocoding = async (cityName) => {
  let response = await goecodingResponse(cityName);
  let geoJSON = await response.json();
  let coordinates = {
    latitude: geoJSON[0].lattitude,
    longitude: geoJSON[0].longitude,
  };
  return coordinates;
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

export const getRecommended = async (artist, recommendedArray) => {
  var currRecommended = recommendedArray;
  let response = await lastfmResponse(artist);
  let lastfmJSON = await response.json();
  let recommendedArtists = lastfmJSON.similarartists;
  for (let i = 0; i < 5; i++) {
    if (recommendedArtists.artist[i]) {
      currRecommended.push({
        artist: recommendedArtists.artist[i].name,
        image: recommendedArtists.artist[i].image[0]["#text"],
      });
    }
  }
  return currRecommended;
};

export const createArtistObj = async (artist, id, city, radius, image) => {
  let artistInfoObj = {
    artist: artist,
    id: id,
    image: image,
    eventInfo: await formatEvents(id, city, radius),
  };
  return artistInfoObj;
};

// const response = await getTopArtists(timeRange, limit);
// const { items } = await response.json();
// for (let idx in items) {
//   let artistObj = items[idx];
//   var artistName = artistObj["name"];
//   var id = await getArtistID(artistName);
//   topArtists[idx] = {
//     artist: artistName,
//     eventInfo: await formatEvents(id, city, radius),
//     id: id,
//     image: artistObj.images[0].url,
//   };
// }
