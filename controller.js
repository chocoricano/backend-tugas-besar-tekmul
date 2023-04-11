import {
  helloWorld,
  getKeywords,
  getProductsByKeyword,
} from './service.js';

const routes = async (app, options) => {
  app.get('/', async (request, reply) => {
    const result = await helloWorld();
    reply.send({ result });
  });

  app.post('/keywords', async (request, reply) => {
    try {
      const text = request.body.text;
      console.log(text);
      const result = await getKeywords(text);
      const result2 = await getProductsByKeyword(result, 1, 20);
      reply.send(result2);
    } catch (error) {
      reply.send("No products found");
    }
  });
};

export { routes };
