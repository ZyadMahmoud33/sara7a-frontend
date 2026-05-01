import { io } from "socket.io-client";

const socket = io("http://localhost:3000", {
  autoConnect: false,
  auth: {
    token: localStorage.getItem("token"), // ✅ بدون Bearer
  },
});

export default socket;