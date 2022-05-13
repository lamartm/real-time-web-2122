import express from "express";
import http from "http";
import { Server } from "socket.io";
import fetch from "node-fetch";
import bodyParser from "body-parser";
import getUserData from "./database.js";

const app = express();
const port = process.env.PORT || 4000;
const server = http.createServer(app);
const io = new Server(server);

const data = [];
const currentdate = new Date();

const month =
  currentdate.getMonth() + 1 < 10
    ? `0${currentdate.getMonth() + 1}`
    : currentdate.getMonth() + 1;

const day =
  currentdate.getDate() < 10
    ? `0${currentdate.getDate()}`
    : currentdate.getDate();

const date = `${currentdate.getFullYear()}-${month}-${day}`;
console.log(date);

app.set("view engine", "ejs");
app.set("views", "views");
app.use(express.static("public"));
app.use(
  bodyParser.urlencoded({
    extended: false,
  })
);

app.use((err, req, res, next) => {
  res.status(404).send("404 not found");
});

app.get("/", async (req, res) => {
  res.render("homepage", {
    pageTitle: `homepage`,
  });
});

app.get("/game/:username+:room", (req, res) => {
  res.render("chat", {
    pageTitle: `game`,
  });
});

app.post("/", (req, res) => {
  getUserData("rooms").then(async (data) => {
    const userCheck = await data.findOne({
      room: req.body.room,
      username: req.body.username,
    });

    if (userCheck === null) {
      data.insertOne({
        username: req.body.username,
        room: req.body.room,
        points: 0,
        answer: "true",
      });
    }
  });
  res.redirect(`/game/${req.body.username}+${req.body.room}`);
});

server.listen(port, () => {
  console.log(`Listening to ${port}`);
});

async function getGameData() {
  return await fetch(
    `https://api.rawg.io/api/games?key=d810cd39dd2a431ba773e48a5c657557&page_size=40&metacritic=60,100&dates=2014-01-01,${date}`
  )
    .then((r) => r.json())
    .then((d) =>
      d.results.forEach((d) => {
        if (d.background_image) {
          data.push({
            name: d.name,
            rating: d.metacritic,
            image: d.background_image,
          });
        }
      })
    );
}
await getGameData();

const randomGames = () => {
  const d = data;
  const r = d.splice(Math.floor(Math.random() * d.length), 1);
  const notSame = d.filter((game) => game.rating !== r[0].rating);
  const o = notSame.splice(Math.floor(Math.random() * notSame.length), 1);
  return r.concat(o);
};

const database = await getUserData("rooms");

getUserData("rooms").then(async (userData) => {
  io.on("connection", (socket) => {
    socket.on("page-load", async (room, user) => {
      const userCheck = await userData.findOne({
        room: room,
        username: user,
      });

      socket.username = user;

      socket.emit("firstLoad", socket.username, userCheck.points);

      socket.join(userCheck.room);
      socket.on("showGames", () => {
        const clients = io.sockets.adapter.rooms.get(userCheck.room);

        clients.size === 1
          ? socket.emit(
              "changeMessage",
              "initial",
              "Waiting for other players..",
              "Hold on!"
            )
          : io
              .in(userCheck.room)
              .emit(
                "changeMessage",
                "none",
                "You got it wrong!",
                "Waiting for the other players.."
              );

        io.in(userCheck.room).emit("changeData", ...randomGames());
      });
    });

    socket.on("send-msg", (message, room) => {
      socket.to(room).emit("receive-msg", message);
    });

    socket.on("join-room", (room, cb) => {
      socket.join(room);
      cb(`Joined ${room}`);
    });

    socket.on("changeGame", async (room, user) => {
      const userCheck = await userData.findOne({
        room: room,
        username: user,
      });

      io.in(userCheck.room).emit("changeData", ...randomGames());
    });

    socket.on("scores", async (data, room, user) => {
      const usersInRoom = await userData
        .find({
          room: room,
        })
        .toArray();

      const userCheck = await userData.findOne({
        room: room,
        username: user,
      });

      io.in(userCheck.room).emit("updateLeaderboard", data, usersInRoom, user);
    });

    socket.on("updateAnswer", async (room, user, answer) => {
      const userCheck = await userData.findOne({
        room: room,
        username: user,
      });

      const usersInRooms = await userData
        .find({
          room: room,
        })
        .toArray();

      if (answer === "true") {
        database.updateMany({ room: room }, { $set: { answer: "true" } });
      } else {
        database.updateOne(
          { room: room, username: user },
          { $set: { answer: answer } }
        );
      }

      const check = usersInRooms.every((element) => element.answer === "false");

      if (check === true) {
        io.in(userCheck.room).emit("checkForAnswer", check);
        database.updateMany({ room: room }, { $set: { answer: "true" } });
      }
    });

    socket.on("sendCurrentRoom", async (room, user, game1, game2) => {
      const userCheck = await userData.findOne({
        room: room,
        username: user,
      });

      socket.emit("updateScore", userCheck, game1, game2);
    });

    socket.on("updatePoints", async (points, room, user) => {
      database.updateOne(
        { room: room, username: user },
        { $set: { points: points } }
      );
    });

    socket.on("updateMessage", async (state, room, user, msg1, msg2) => {
      const userCheck = await userData.findOne({
        room: room,
        username: user,
      });

      io.in(userCheck.room).emit("changeMessage", state, msg1, msg2);
    });

    socket.on("endGame", async (room, user) => {
      database.deleteMany({ room: room });

      io.in(room).emit("gameWon", user);
      io.socketsLeave(room);
    });
  });
});
