const server = Bun.serve({
  async fetch(req) {
    const url = new URL(req.url);

    if (url.pathname === "/" && req.method === "GET") {
      return new Response("Hello World!");
    }

    return new Response("404!");
  },
});

console.log(`Listening on ${server.url}`);
