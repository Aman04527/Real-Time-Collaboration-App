import { io } from "socket.io-client";

const initSocket = () => {
  const option = {
    "force new connection": true,
    reconnectionAttempts: "Infinity",
    timeout: 10000,
    transports: ["websocket"],
  };
  const socket = io(process.env.REACT_APP_BACKEND_URL, option);
  return socket;
};

export default initSocket;
