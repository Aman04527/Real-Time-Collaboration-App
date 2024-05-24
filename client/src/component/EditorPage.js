import React, { useEffect, useRef, useState } from "react";
import Client from "./Client";
import Editor from "./Editor";
import {
  useLocation,
  useParams,
  useNavigate,
  Navigate,
} from "react-router-dom";
import { initSocket } from "../socket";
import { toast } from "react-hot-toast";

function EditorPage() {
  const [clients, setClients] = useState([]);

  const socketRef = useRef(null);
  const location = useLocation();
  const navigate = useNavigate();
  const { roomId } = useParams();

  useEffect(() => {
    const init = async () => {
      try {
        socketRef.current = await initSocket();
        socketRef.current.on("connect_error", handleErrors);
        socketRef.current.on("connect_failed", handleErrors);

        // Join the room
        socketRef.current.emit("join", {
          roomId,
          username: location.state?.username,
        });

        // Listen for new clients joining the chatroom
        socketRef.current.on("joined", ({ clients, username, socketId }) => {
          // this insure that new user connected message do not display to that user itself
          if (username !== Location.state?.username) {
            toast.success(`${username} joined the room.`);
          }
          setClients(clients);
          // // also send the code to sync
          // socketRef.current.emit(ACTIONS.SYNC_CODE, {
          //   code: codeRef.current,
          //   socketId,
          // });
        });

        console.log("Socket initialized:", socketRef.current);
      } catch (err) {
        handleErrors(err);
      }
    };

    const handleErrors = (err) => {
      console.log("Error", err);
      toast.error("Socket connection failed, Try again later");
      navigate("/");
    };

    init();
  }, [location, navigate, roomId]);

  if (!location.state) {
    return <Navigate to="/" />;
  }

  return (
    <div className="container-fluid vh-100">
      <div className="row h-100">
        <div
          className="col-md-2 bg-dark text-light d-flex flex-column h-100"
          style={{ boxShadow: "2px 0px 4px rgba(0, 0, 0, 0.1)" }}
        >
          <img
            src="/images/logo-no-background.png"
            alt="Logo"
            className="img-fluid mx-auto"
            style={{ maxWidth: "150px", marginTop: "15px" }}
          />
          <hr />
          {/* client list container */}
          <div className="d-flex flex-column overflow-auto">
            {clients.map((client) => (
              <Client key={client.socketId} username={client.username} />
            ))}
          </div>
          <div className="mt-auto">
            <hr />
            <button className="btn btn-success">Copy Room Id</button>
            <button className="btn btn-danger mt-2 mb-2 px-3 btn-block">
              Leave Room
            </button>
          </div>
        </div>
        <div className="col-md-10 text-light d-flex flex-column h-100">
          <Editor />
        </div>
      </div>
    </div>
  );
}

export default EditorPage;
