const express = require("express");
const app = express();
const port = process.env.PORT || 4000;
const http = require("http");
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);

app.set("view engine", "ejs");
app.set("views", "views");
app.use(express.static("public"));

app.use((err, req, res, next) => {
  res.status(404).send("404 not found");
});

app.get("/", (req, res) => {
  res.render("chat", {
    pageTitle: `chat`,
  });
});

server.listen(port, () => {
  console.log(`Listening to ${port}`);
});

io.on("connection", (socket) => {
  console.log(socket.id);
  socket.on("send-msg", (message) => {
    socket.broadcast.emit("receive-msg", message);
    console.log(message);
  });
});
