const express = require("express");
const { createServer } = require("http");
const {
  addPlayer,
  getOtherPlayers,
  getPlayer,
  editPlayer,
  deletePlayer,
} = require("./modules/playerCache");
const path = require("path");

const app = express();
const server = createServer(app);

const port = process.env.PORT || 3000;

/* STATIC SERVER - Landing Page */
app.use(express.static("public"));
app.get("/", function (req, res) {
  res.sendFile(path.join(__dirname + "/public/index.html"));
});

/* RealTime Server */
const io = require("socket.io")(server, {
  cors: {
    origin: "*",
  },
});

/* On Connect */
io.on("connection", (socket) => {
  const { id } = socket;

  const initUserData = { tiles: [] };

  addPlayer(id, initUserData);

  socket.emit("connection", { id, ...initUserData });

  const users = getOtherPlayers(id);

  if (users.length) {
    socket.emit("existingUsers", { users });
  }

  socket.broadcast.emit("newUser", { id });

  socket.on("moveUser", (data) => {
    const currentPlayer = getPlayer(id);

    if (currentPlayer && currentPlayer != data) {
      editPlayer(id, data);

      socket.broadcast.emit("moveUser", { ...data, player: { id } });
    }
  });

  socket.on("disconnect", () => {
    deletePlayer(id);
    socket.broadcast.emit("removeUser", id);
  });
});

server.listen(port);
console.log("listening on *:" + port);
