export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");

  if (!code) {
    return new Response(
      JSON.stringify({ error: "Missing code parameter" }),
      { status: 400 }
    );
  }

  try {
    const response = await fetch("https://api.login.yahoo.com/oauth2/get_token", {
      method: "POST",
      headers: {
        "Authorization":
          "Basic " +
          Buffer.from(
            process.env.YAHOO_CLIENT_ID + ":" + process.env.YAHOO_CLIENT_SECRET
          ).toString("base64"),
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: process.env.YAHOO_REDIRECT_URI, // matches your ngrok URL
      }),
    });

    const data = await response.json();

    console.log("Initial token response:", data);

    return new Response(JSON.stringify(data), { status: 200 });
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
    });
  }
}


