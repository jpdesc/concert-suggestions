import * as dotenv from "dotenv";
dotenv.config();
import querystring from "querystring";
// import topArtistsArray from "app.js";

const client_id = process.env.CLIENT_ID;
const client_secret = process.env.CLIENT_SECRET;
const refresh_token = process.env.REFRESH_TOKEN;
const ticketmaster_api_key = process.env.TICKETMASTER_API_KEY;
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
  //   console.log(access_token);
  time_range = `time_range=${time_range}`;
  limit =
    limit && !time_range
      ? `limit=${limit}`
      : limit && time_range
      ? `&limit=${limit}`
      : "";
  const TOP_ARTISTS_ENDPOINT = TOP_ARTISTS_BASE_ENDPOINT + time_range + limit;
  //   console.log(TOP_ARTISTS_ENDPOINT);
  return fetch(TOP_ARTISTS_ENDPOINT, {
    headers: {
      Authorization: `Bearer ${access_token}`,
    },
  });
};

export const getTopArtistsArray = (topArtistsObj) => {
  let topArtistsArray = [];
  for (let i = 0; i < 50; i++) {
    topArtistsArray.push(topArtistsObj[i]);
  }
  return topArtistsArray;
};

export const eventsResponse = (id, city, radius) => {
  if (!radius) {
    radius = 25;
  }
  const LOCATION_STRING =
    city && radius ? `&city=${city}&radius=${radius}` : "";
  const GET_EVENTS_ENDPOINT =
    TICKETMASTER_BASE_ENDPOINT + "&id=" + id + "&includeSpellcheck=no";

  return fetch(GET_EVENTS_ENDPOINT);
};

export const getEvents = async (id, city, radius) => {
  let response = await eventsResponse(id, city, radius);
  let eventsJSON = await response.json();
  let parsedEvents = eventsJSON._embedded;
  let eventsArr = [];
  var max = parsedEvents ? parsedEvents.events.length : 0;
  for (let i = 0; i < max; i++) {
    if (
      parsedEvents.events[i]
        ? parsedEvents.events[i].name.includes(artist)
        : false
    ) {
      eventsArr.push(parsedEvents.events[i]);
    }
  }
  console.log(eventsArr);
  return eventsArr;
};

const getPrettyPrinted = (jsonObj) => {
  var jsonEventPretty = JSON.stringify(jsonObj, null, 2);
  return jsonEventPretty;
};

export const formatEvents = async (artist) => {
  let events = await getEvents(artist);
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
