import { io } from "https://cdn.socket.io/4.4.1/socket.io.esm.min.js";

const msgInput = document.getElementById("msg-input");
const chatForm = document.getElementById("chat-form");
const messageContainer = document.getElementById("messageContainer");
const message1 = document.getElementById("message1");
const message2 = document.getElementById("message2");

const socket = io();

let game = 0;

let gameRating1;
let gameRating2;

const uri = document.URL;
const username = uri.split("game/")[1];
const selectedRoom = uri.split("+")[1];
const selectedUsername = username.split("+")[0];

const newParagraph = document.createElement("p");

const game1text = document.getElementById("game1text");
const game1img = document.getElementById("game1img");
const game2text = document.getElementById("game2text");
const game2img = document.getElementById("game2img");

socket.on("connect", () => {
  console.log(socket.id);

  socket.emit("showGames");
});

socket.on("firstLoad", (username, scores) => {
  console.log(username);
  displayMessage(`You connected with username: ${username}`);
  socket.emit("scores", { score: scores }, selectedRoom, selectedUsername);
});

socket.on("receive-msg", (message) => {
  displayMessage(message);
});

socket.on("gameData", (randomGame1, randomGame2) => {
  setGameData(randomGame1, randomGame2);
});

socket.on("changeData", (randomGame1, randomGame2) => {
  setGameData(randomGame1, randomGame2);
});

socket.on("updateLeaderboard", (scores, data, id) => {
  const userScores = document.querySelectorAll(".scores");
  const work = (e) =>
    Array.from(userScores).some((d) => d.textContent.includes(e));
  console.log(id);
  data.forEach((d) => {
    if (work(id)) {
      if (d.room === selectedRoom && d.username === id) {
        userScores.forEach((user) => {
          if (user.textContent.includes(id)) {
            console.log(d.points);
            user.textContent = `Player ${id} has ${d.points} points`;
          }
        });
      }
    } else {
      if (d.room === selectedRoom && work(d.username) === false) {
        const addPlayer = document
          .getElementById("leaderboard")
          .appendChild(newParagraph.cloneNode(true));

        addPlayer.textContent = `Player ${d.username} has ${d.points} points`;
        addPlayer.setAttribute("class", "scores");
      }
    }
  });
});
socket.on("changeMessage", (state, firstMessage, secondMessage) => {
  messageContainer.style.display = state;

  if (firstMessage && secondMessage) {
    message1.textContent = `${firstMessage}`;
    message2.textContent = `${secondMessage}`;
  }
});

socket.emit("page-load", selectedRoom, selectedUsername);

socket.emit("updateAnswer", selectedRoom, selectedUsername, "true");

document.getElementById("game1").addEventListener("click", () => {
  socket.emit(
    "sendCurrentRoom",
    selectedRoom,
    selectedUsername,
    gameRating1,
    gameRating2
  );
});

document.getElementById("game2").addEventListener("click", () => {
  socket.emit(
    "sendCurrentRoom",
    selectedRoom,
    selectedUsername,
    gameRating2,
    gameRating1
  );
});

socket.on("checkForAnswer", (check) => {
  if (check === true) {
    messageContainer.style.display = "initial";
    setTimeout(() => {
      socket.emit("changeGame", selectedRoom, selectedUsername);
      messageContainer.style.display = "none";
    }, 1000);
  }
});

socket.on("updateScore", (score, game1, game2) => {
  updateGameScore(game1, game2, score);
});

socket.on("gameWon", (user) => {
  messageContainer.style.display = "initial";
  message1.textContent = `${user} won the game!`;
  message2.textContent = "Going back to the homepage..";
  setTimeout(() => {
    document.location.href = "/";
  }, 3000);
});

chatForm.addEventListener("submit", (d) => {
  d.preventDefault();
  const msg = msgInput.value;

  if (msg === "") return;
  displayMessage(msg);
  socket.emit("send-msg", msg, selectedRoom);

  msgInput.value = "";
});

const displayMessage = (msg) => {
  const div = document.createElement("div");
  div.textContent = msg;
  document.getElementById("msg-container").append(div);
};

const updateGameScore = (gameRating1, gameRating2, score) => {
  if (gameRating1 > gameRating2) {
    socket.emit("changeGame", selectedRoom, selectedUsername);
    if (score.points < 4) {
      score.points++;
      socket.emit("updateAnswer", selectedRoom, selectedUsername, "true");
      socket.emit("updatePoints", score.points, selectedRoom, selectedUsername);
      socket.emit(
        "updateMessage",
        "initial",
        selectedRoom,
        selectedUsername,
        `Player ${selectedUsername} got it right!`,
        "Next question.."
      );

      setTimeout(() => {
        socket.emit(
          "updateMessage",
          "none",
          selectedRoom,
          selectedUsername,
          "You got it wrong!",
          "Waiting for the other players.."
        );
      }, 1500);

      console.log(score.points);
      setTimeout(() => {
        socket.emit(
          "scores",
          { score: score.points },
          selectedRoom,
          selectedUsername
        );
      }, 900);
    } else {
      socket.emit("updatePoints", 0, selectedRoom, selectedUsername);
      score.points = 0;
      socket.emit("endGame", selectedRoom, selectedUsername);
      displayMessage(`You have won the game!`);
    }
  } else {
    socket.emit("updateAnswer", selectedRoom, selectedUsername, "false");
    messageContainer.style.display = "initial";

    displayMessage(`That is incorrect`);
  }
};

const setGameData = (randomGame1, randomGame2) => {
  game1img.setAttribute("src", `${randomGame1.image}`);
  game2img.setAttribute("src", `${randomGame2.image}`);

  game1text.textContent = `${randomGame1.name}`;
  game2text.textContent = `${randomGame2.name}`;

  gameRating1 = randomGame1.rating;
  gameRating2 = randomGame2.rating;
};
