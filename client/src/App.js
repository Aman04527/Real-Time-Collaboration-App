import "./App.css";
import Home from "./component/Home";
import EditorPage from "./component/EditorPage";
import Whiteboard from "./component/Whiteboard";
import { Routes, Route } from "react-router-dom";
import { Toaster } from "react-hot-toast";

function App() {
  return (
    <>
      <Toaster position="top-center"></Toaster>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/editor/:roomId" element={<EditorPage />} />
        <Route path="/whiteboard/:roomId" element={<Whiteboard />} />
      </Routes>
    </>
  );
}

export default App;
