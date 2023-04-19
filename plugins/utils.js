import fastifyOauth2 from "@fastify/oauth2";

/** @param {import('fastify').FastifyInstance} fastify */
import fs from "fs/promises"; //new stuff! with promises API not callbacks
import { join } from "desm";

export default async function (app, opts) {
  app.register(import("@fastify/formbody"));
  app.register(import("@fastify/websocket"));

  app.register(import("@fastify/static"), {
    root: join(import.meta.url, "../static"),
    serve: false, // will not create routes for each file
  });

  app.register(import("@fastify/secure-session"), {
    // the name of the attribute decorated on the request-object, defaults to 'session'
    sessionName: "session",
    // the name of the session cookie, defaults to value of sessionName
    cookieName: "my-session-cookie",
    // adapt this to point to the directory where secret-key is located
    key: await fs.readFile(join(import.meta.url, "../secret-key")),
    cookie: {
      path: "/",
      // options for setCookie, see https://github.com/fastify/fastify-cookie
    },
  });

  await app.register(fastifyOauth2, {
    name: "twitchOAuth2",
    scope: ["moderator:read:chatters"],
    credentials: {
      client: {
        id: opts.twitch_client_id,
        secret: opts.twitch_secret,
      },
      auth: fastifyOauth2.TWITCH_CONFIGURATION,
    },
    tokenRequestParams: {
      client_id: opts.twitch_client_id,
      client_secret: opts.twitch_secret,
    },
    startRedirectPath: "/twitch/login", //GET path created by this plugin
    callbackUri: "http://localhost:3000/twitch/callback", //defined in the Twitch dashboard as callback Uri for this client app
  });
}
