import mq from "mqemitter";

/** @param {import('fastify').FastifyInstance} fastify */
export default async function (app, opts) {
  const emitter = mq({ concurrency: 5 });
  app.decorate("mq", emitter);
}
