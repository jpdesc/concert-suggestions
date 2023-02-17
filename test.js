const attractionResponse = async (artist) => {
  const ATTRACTION_ENDPOINT = ARTIST_INFO_ENDPOINT + "&keyword=" + artist;

  return fetch(ATTRACTION_ENDPOINT);
};

export const getArtistInfo = async (artist) => {
  let response = await eventsResponse(artist);
  let artistJSON = await response.json();
  let parsedInfo = artistJSON._embedded;
  return parsedInfo;
};

const getAttractionID = async (artist) => {
  const ATTRACTION_ENDPOINT = ARTIST_INFO_ENDPOINT + "&keyword=" + artist;

  return fetch(attractionEndpoint);
};
