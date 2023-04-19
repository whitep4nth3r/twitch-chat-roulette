import { getRandomEntry } from "@whitep4nth3r/get-random-entry";

const loginHook = async (request, reply) => {
  const token = request.session.get("token");

  if (!token) {
    reply.redirect("/twitch/login");
    return;
  }
};

const getUserIdFromAccessToken = async (access_token) => {
  const res = await fetch("https://id.twitch.tv/oauth2/validate", {
    headers: {
      Authorization: `Bearer ${access_token}`,
    },
  });

  const data = await res.json();
  return data.user_id ?? null;
};

/** @param {import('fastify').FastifyInstance} fastify */
export default async function (app, opts) {
  const getChatters = async (access_token) => {
    const broadcaster_id = await getUserIdFromAccessToken(access_token);

    if (!broadcaster_id) {
      throw new Error();
    }

    const res = await fetch(
      `https://api.twitch.tv/helix/chat/chatters?broadcaster_id=${broadcaster_id}&moderator_id=${broadcaster_id}`,
      {
        headers: {
          Authorization: `Bearer ${access_token}`,
          "Client-Id": opts.twitch_client_id,
        },
      },
    );

    const data = await res.json();

    console.log(data);

    return data;
  };

  app.get("/twitch/callback", async function (request, reply) {
    const response = await this.twitchOAuth2.getAccessTokenFromAuthorizationCodeFlow(request);

    request.session.set("token", response.token.access_token);
    reply.redirect("/broadcaster");
  });

  app.get("/broadcaster", { preHandler: loginHook }, async function (request, reply) {
    reply.sendFile("broadcaster.html");
    return reply;
  });

  app.post("/choose", { preHandler: loginHook }, async function (request, reply) {
    const token = request.session.get("token");
    const chatters = await getChatters(token);

    const randomChatter = getRandomEntry(chatters.data);
    app.mq.emit({ topic: "/winners", randomChatter });

    return randomChatter;
  });
}
