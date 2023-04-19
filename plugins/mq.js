import mq from "mqemitter";

/** @param {import('fastify').FastifyInstance} fastify */
export default async function mq(app, opts) {
  const emitter = mq({ concurrency: 5 });
  app.decorate("mq", emitter);
}

mq[Symbol.for("skip-override")] = true;
