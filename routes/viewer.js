/** @param {import('fastify').FastifyInstance} fastify */
export default async function (app, opts) {
  app.get("/", async function (request, reply) {
    reply.sendFile("login.html");
    return reply;
  });

  app.get("/viewer", async function (request, reply) {
    reply.sendFile("viewer.html");
    return reply;
  });

  app.get(
    "/winners",
    { websocket: true },
    (connection /* SocketStream */, req /* FastifyRequest */) => {
      app.mq.on("/winners", function (message, cb) {
        connection.socket.send(JSON.stringify(message));

        // TODO — to support more than one user at a time
        // provide username etc in topic of emitter to namespace events

        // call callback when you are done
        // do not pass any errors, the emitter cannot handle it.
        cb();
      });
    },
  );
}
