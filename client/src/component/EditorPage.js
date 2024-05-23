//If we want to add another page like whiteboard page add the page at this src/component folder as whiteboard
import React, { useState } from "react";
import Client from "./Client";
import Editor from "./Editor";

function EditorPage() {
  const [clients, setClients] = useState([
    { socketId: 1, username: "Aman" },
    { socketId: 2, username: "Jha" },
  ]);

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
          {/* client list container*/}
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
