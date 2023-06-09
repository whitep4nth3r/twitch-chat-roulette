import mq from "mqemitter";

/** @param {import('fastify').FastifyInstance} fastify */
export default async function mqPlugin(app, opts) {
  const emitter = mq({ concurrency: 5 });
  app.decorate("mq", emitter);
}

mqPlugin[Symbol.for("skip-override")] = true;
