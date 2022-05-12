import express from "express";
import http from "http";
import { Server } from "socket.io";
import fetch from "node-fetch";
import bodyParser from "body-parser";
import sessions from "express-session";
import getUserData from "./database.js";

const app = express();
const port = process.env.PORT || 4000;
const server = http.createServer(app);
const io = new Server(server);

const data = [];
let storedUsers = [];

app.set("view engine", "ejs");
app.set("views", "views");
app.use(express.static("public"));
app.use(
  bodyParser.urlencoded({
    extended: false,
  })
);

app.use(
  sessions({
    secret: "turbokitkat",
    saveUninitialized: true,
    cookie: {
      maxAge: 60000,
    },
    resave: false,
  })
);

app.use((err, req, res, next) => {
  res.status(404).send("404 not found");
});

app.get("/", async (req, res) => {
  await getUserData("rooms")
    .then((user) =>
      user.findOne({
        name: "hell",
      })
    )
    .then((d) => {
      console.log(d);
    });
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
  // session = req.session;
  // session.userid = req.body.username;

  let foundUser = storedUsers.find(
    (d) => d.username === req.body.username && d.room === req.body.room
  );
  getUserData("rooms").then(async (data) => {
    const emailCheck = await data.findOne({
      room: req.body.room,
      username: req.body.username,
    });
    console.log(emailCheck);

    if (foundUser === undefined) {
      data.insertOne({
        username: req.body.username,
        room: req.body.room,
        points: 0,
        answer: "true",
      });
      storedUsers.push({
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

async function firstFunction() {
  return await fetch(
    "https://api.rawg.io/api/games?key=d810cd39dd2a431ba773e48a5c657557&page_size=40&metacritic=70,100&dates=2017-01-01,2021-12-31"
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
await firstFunction();

// let rooms = [{ players: ["", ""], started: true, id: "" }];

const randomGames = () => {
  const d = data;
  const r = d.splice(Math.floor(Math.random() * d.length), 1);
  const notSame = d.filter((game) => game.rating !== r[0].rating);
  const o = notSame.splice(Math.floor(Math.random() * notSame.length), 1);
  return r.concat(o);
};

io.on("connection", (socket) => {
  // const connectedUser = storedUsers.find((d) => d.username === session.userid);

  socket.on("page-load", (room, user) => {
    const userAndRoom = storedUsers.find(
      (d) => d.username === user && d.room === room
    );

    socket.username = user;

    socket.emit("firstLoad", socket.username, userAndRoom.points);

    socket.join(userAndRoom.room);
    socket.on("showGames", () => {
      const clients = io.sockets.adapter.rooms.get(userAndRoom.room);

      clients.size === 1
        ? socket.emit(
            "changeMessage",
            "initial",
            "Waiting for other players..",
            "Hold on!"
          )
        : io
            .in(userAndRoom.room)
            .emit(
              "changeMessage",
              "none",
              "You got it wrong!",
              "Waiting for the other players.."
            );

      io.in(userAndRoom.room).emit("changeData", ...randomGames());
    });
  });

  socket.on("send-msg", (message, room) => {
    if (room === "") {
      socket.broadcast.emit("receive-msg", message);
    } else {
      io.in(room).emit("receive-msg", message);
    }
  });

  socket.on("join-room", (room, cb) => {
    socket.join(room);
    cb(`Joined ${room}`);
  });

  socket.on("changeGame", (room, user) => {
    const userAndRoom = storedUsers.find(
      (d) => d.username === user && d.room === room
    );

    io.in(userAndRoom.room).emit("changeData", ...randomGames());
  });

  socket.on("scores", (data, room, user) => {
    const userAndRoom = storedUsers.find(
      (d) => d.username === user && d.room === room
    );

    io.in(userAndRoom.room).emit("updateLeaderboard", data, storedUsers, user);
  });

  socket.on("updateAnswer", (room, user, answer) => {
    const userAndRoom = storedUsers.find(
      (d) => d.username === user && d.room === room
    );
    userAndRoom.answer = answer;

    const usersInRoom = storedUsers.filter((user) => {
      if (user.room === room) {
        return user;
      }
    });

    const check = usersInRoom.every((element) => element.answer === "false");

    if (check === true) {
      io.in(userAndRoom.room).emit("checkForAnswer", check);
      usersInRoom.forEach((d) => {
        d.answer = "true";
      });
    }
  });

  socket.on("sendCurrentRoom", (room, user, game1, game2) => {
    const userAndRoom = storedUsers.find(
      (d) => d.username === user && d.room === room
    );

    socket.emit("updateScore", userAndRoom, game1, game2);
  });

  socket.on("updatePoints", (points, room, user) => {
    const userAndRoom = storedUsers.find(
      (d) => d.username === user && d.room === room
    );

    userAndRoom.points = points;
  });

  socket.on("updateMessage", (state, room, user, msg1, msg2) => {
    const userAndRoom = storedUsers.find(
      (d) => d.username === user && d.room === room
    );

    io.in(userAndRoom.room).emit("changeMessage", state, msg1, msg2);
  });

  socket.on("endGame", (room, user) => {
    for (let i = 0; i < storedUsers.length; i++) {
      if (storedUsers[i].room === room) {
        storedUsers.splice(i, 1);
        i--;
      }
    }

    io.in(room).emit("gameWon", user);
    io.socketsLeave(room);
  });
});
