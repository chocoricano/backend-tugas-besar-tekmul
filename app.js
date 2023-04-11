import fastify from 'fastify';
import cors from '@fastify/cors';
import { routes } from './controller.js';

const app = fastify();

app.register(cors, {
  origin: true,
});

app.register(routes);

app.listen({ port: 3000, host: '0.0.0.0' }, function (err, address) {
  if (err) {
    app.log.error(err);
    process.exit(1);
  }
  console.log(`Server listening on ${address}`);
});
