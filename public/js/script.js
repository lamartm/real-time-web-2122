import { io } from "https://cdn.socket.io/4.4.1/socket.io.esm.min.js";

const msgInput = document.getElementById("msg-input");
const chatForm = document.getElementById("chat-form");

const socket = io("http://localhost:4000");

socket.on("connect", () => {
  displayMessage(`You connected with id: ${socket.id}`);
});

socket.on("receive-msg", (message) => {
  displayMessage(message);
});

chatForm.addEventListener("submit", (d) => {
  d.preventDefault();
  const msg = msgInput.value;

  if (msg === "") return;
  displayMessage(msg);
  socket.emit("send-msg", msg);

  msgInput.value = "";
});

const displayMessage = (msg) => {
  const div = document.createElement("div");
  div.textContent = msg;
  document.getElementById("msg-container").append(div);
};
