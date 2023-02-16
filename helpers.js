import * as dotenv from "dotenv";
dotenv.config();
import querystring from "querystring";
// import topArtistsArray from "app.js";

const client_id = process.env.CLIENT_ID;
const client_secret = process.env.CLIENT_SECRET;
const refresh_token = process.env.REFRESH_TOKEN;
const ticketmaster_api_key = process.env.TICKETMASTER_API_KEY;

const basic = Buffer.from(`${client_id}:${client_secret}`).toString("base64");
const TOKEN_ENDPOINT = `https://accounts.spotify.com/api/token`;

const TOP_ARTISTS_BASE_ENDPOINT = `https://api.spotify.com/v1/me/top/artists/?`;
const TICKETMASTER_BASE_ENDPOINT =
  "https://app.ticketmaster.com/discovery/v2/events.json?apikey=" +
  ticketmaster_api_key;

// "?time_range=long_term&limit=50";

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
    // console.log("artist number " + i + `= ${topArtistsObj[i]}`);

    topArtistsArray.push(topArtistsObj[i]);
  }
  //   console.log(topArtistsArray);
  return topArtistsArray;
};

// "&city=Los Angeles" +

export const eventsResponse = (artist) => {
  const GET_EVENTS_ENDPOINT =
    TICKETMASTER_BASE_ENDPOINT + "&keyword=" + artist + "&includeSpellcheck=no";

  return fetch(GET_EVENTS_ENDPOINT);
};

export const getEvents = async (artist) => {
  let response = await eventsResponse(artist);
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
      //   console.log("true");
      eventsArr.push(parsedEvents.events[i]);
      //   console.log(getPrettyPrinted(parsedEvents.events[i]));
    }
  }
  //   console.log(eventsArr);

  return eventsArr;
};

const getPrettyPrinted = (jsonObj) => {
  var jsonEventPretty = JSON.stringify(jsonObj, null, 2);
  return jsonEventPretty;
};
