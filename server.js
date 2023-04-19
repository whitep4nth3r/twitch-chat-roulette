// blog post ideas: auth with Twitch using Fastify

import fastify from "fastify";
import fastifyOauth2 from "@fastify/oauth2";
import dotenv from "dotenv";
import fs from "fs/promises"; //new stuff! with promises API not callbacks
import { join } from "desm";

dotenv.config();

const opts = {
  logger: {
    level: "info",
  },
};

// alternative logger: https://github.com/fastify/one-line-logger

// We want to use pino-pretty only if there is a human watching this,
// otherwise we log as newline-delimited JSON.
if (process.stdout.isTTY) {
  opts.logger.transport = { target: "pino-pretty" };
}

const app = fastify(opts);

app.register(import("@fastify/secure-session"), {
  // the name of the attribute decorated on the request-object, defaults to 'session'
  sessionName: "session",
  // the name of the session cookie, defaults to value of sessionName
  cookieName: "my-session-cookie",
  // adapt this to point to the directory where secret-key is located
  key: await fs.readFile(join(import.meta.url, "secret-key")),
  cookie: {
    path: "/",
    // options for setCookie, see https://github.com/fastify/fastify-cookie
  },
});

const getChatters = async (access_token) => {
  const broadcaster_id = "469006291";

  const res = await fetch(
    `https://api.twitch.tv/helix/chat/chatters?broadcaster_id=${broadcaster_id}&moderator_id=${broadcaster_id}`,
    {
      headers: {
        Authorization: `Bearer ${access_token}`,
        "Client-Id": process.env.TWITCH_CLIENT_ID,
      },
    },
  );

  const data = await res.json();

  return data;
};

await app.register(fastifyOauth2, {
  name: "twitchOAuth2",
  scope: ["moderator:read:chatters"],
  credentials: {
    client: {
      id: process.env.TWITCH_CLIENT_ID,
      secret: process.env.TWITCH_SECRET,
    },
    auth: fastifyOauth2.TWITCH_CONFIGURATION,
  },
  tokenRequestParams: {
    client_id: process.env.TWITCH_CLIENT_ID,
    client_secret: process.env.TWITCH_SECRET,
  },
  startRedirectPath: "/twitch/get_token", //GET path created by this plugin
  callbackUri: "http://localhost:3000/twitch/callback", //defined in the Twitch dashboard as callback Uri for this client app
});

app.get("/twitch/callback", async function (request, reply) {
  const response = await this.twitchOAuth2.getAccessTokenFromAuthorizationCodeFlow(request);

  request.session.set("token", response.token.access_token);
  reply.redirect("/");
});

app.get("/", async function (request, reply) {
  const token = request.session.get("token");

  if (!token) {
    reply.redirect("/twitch/get_token");
    return;
  }

  const chatters = await getChatters(token);
  request.log.info({ chatters });
  return chatters;
});

await app.listen({
  port: 3000,
});
