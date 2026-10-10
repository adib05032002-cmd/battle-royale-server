
const http = require("http");
const WebSocket = require("ws");

const server = http.createServer((req, res) => {
  res.writeHead(200, { "Content-Type": "text/plain; charset=utf-8" });
  res.end("سيرفر لعبة باتل رويال راه يخدم!");
});

const wss = new WebSocket.Server({ server });

const players = new Map();

wss.on("connection", (socket) => {
  const id = Math.random().toString(36).slice(2, 10);

  players.set(id, {
    id,
    x: 0,
    z: 0,
    health: 100
  });

  socket.send(JSON.stringify({
    type: "welcome",
    id,
    players: Array.from(players.values())
  }));

  socket.on("message", (message) => {
    try {
      const data = JSON.parse(message.toString());

      if (data.type === "move") {
        const player = players.get(id);
        if (!player) return;

        if (Number.isFinite(data.x) && Number.isFinite(data.z)) {
          player.x = Math.max(-500, Math.min(500, data.x));
          player.z = Math.max(-500, Math.min(500, data.z));
        }

        const update = JSON.stringify({
          type: "players",
          players: Array.from(players.values())
        });

        for (const client of wss.clients) {
          if (client.readyState === WebSocket.OPEN) {
            client.send(update);
          }
        }
      }
    } catch {
      socket.send(JSON.stringify({ type: "error", message: "رسالة غير صالحة" }));
    }
  });

  socket.on("close", () => {
    players.delete(id);

    const update = JSON.stringify({
      type: "players",
      players: Array.from(players.values())
    });

    for (const client of wss.clients) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(update);
      }
    }
  });
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});
