// File: app/api/auth/callback/route.js

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");

  if (!code) {
    return new Response(JSON.stringify({ error: "Missing code" }), {
      status: 400,
    });
  }

  try {
    const response = await fetch("https://api.login.yahoo.com/oauth2/get_token", {
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
        grant_type: "authorization_code",
        redirect_uri: process.env.YAHOO_REDIRECT_URI,
        code,
      }),
    });

    const data = await response.json();
    console.log("Tokens received:", data);

    if (data.error) {
      return new Response(JSON.stringify(data), { status: 400 });
    }

    // ⚠️ Save refresh_token somewhere safe (DB or file). Don't lose it!
    return new Response(JSON.stringify(data), { status: 200 });

  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ error: "Internal Server Error" }), {
      status: 500,
    });
  }

  
}





