// utils/yahooAuth.js
export async function getAccessToken() {
  const res = await fetch("https://api.login.yahoo.com/oauth2/get_token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "Authorization":
        "Basic " +
        Buffer.from(
          process.env.YAHOO_CLIENT_ID + ":" + process.env.YAHOO_CLIENT_SECRET
        ).toString("base64"),
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: process.env.YAHOO_REFRESH_TOKEN,
    }),
  });

  const data = await res.json();
  if (data.error) throw new Error(data.error_description);
  return data.access_token;
}

