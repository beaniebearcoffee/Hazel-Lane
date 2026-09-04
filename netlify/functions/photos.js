const { getStore } = require("@netlify/blobs");

const ADMIN_PASSCODE = process.env.ADMIN_PASSCODE || "HowlingPeak";
const CORS = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS"
};

exports.handler = async function (event) {
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers: CORS, body: "" };
  }

  const store = getStore("portfolio-photos");

  if (event.httpMethod === "GET") {
    const photos = (await store.get("photos", { type: "json" })) || [];
    return { statusCode: 200, headers: CORS, body: JSON.stringify({ photos }) };
  }

  if (event.httpMethod === "POST") {
    let body;
    try {
      body = JSON.parse(event.body || "{}");
    } catch (e) {
      return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: "bad_json" }) };
    }

    if (body.passcode !== ADMIN_PASSCODE) {
      return { statusCode: 401, headers: CORS, body: JSON.stringify({ error: "unauthorized" }) };
    }

    let photos = (await store.get("photos", { type: "json" })) || [];

    if (body.action === "add" && body.entry && typeof body.entry === "object") {
      photos.unshift(body.entry);
    } else if (body.action === "delete" && body.id) {
      photos = photos.filter(function (p) { return p.id !== body.id; });
    } else {
      return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: "bad_request" }) };
    }

    await store.setJSON("photos", photos);
    return { statusCode: 200, headers: CORS, body: JSON.stringify({ photos: photos }) };
  }

  return { statusCode: 405, headers: CORS, body: JSON.stringify({ error: "method_not_allowed" }) };
};
