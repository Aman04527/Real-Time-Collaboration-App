import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import rough from "roughjs/bundled/rough.esm.js";
import initSocket from "../socket";
import { useParams } from "react-router-dom";

const generator = rough.generator();

function Whiteboard() {
  const { roomId } = useParams();
  const socketRef = useRef(null);
  const canvasRef = useRef(null);
  const ctx = useRef(null);
  const [elements, setElements] = useState([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [tool, setTool] = useState("pencil"); // default tool
  const [color, setColor] = useState("black");
  const [strokeWidth, setStrokeWidth] = useState(5);
  const [eraser, setEraser] = useState({ x: 0, y: 0 });

  useEffect(() => {
    socketRef.current = initSocket();

    const canvas = canvasRef.current;
    canvas.width = window.innerWidth * 2;
    canvas.height = window.innerHeight * 2;
    const context = canvas.getContext("2d");
    context.scale(2, 2);
    context.lineCap = "round";
    context.strokeStyle = color;
    context.lineWidth = strokeWidth;
    context.fillStyle = "white"; // Set canvas background to white
    context.fillRect(0, 0, canvas.width, canvas.height); // Apply the background color
    ctx.current = context;

    // Sync with other users
    socketRef.current.on("drawing", ({ action, ...rest }) => {
      switch (action) {
        case "start":
          handleRemoteStart(rest);
          break;
        case "move":
          handleRemoteMove(rest);
          break;
        case "end":
          handleRemoteEnd();
          break;
        default:
          break;
      }
    });

    return () => {
      socketRef.current.disconnect();
    };
  }, []);

  useLayoutEffect(() => {
    const roughCanvas = rough.canvas(canvasRef.current);
    if (elements.length > 0) {
      ctx.current.clearRect(
        0,
        0,
        canvasRef.current.width,
        canvasRef.current.height
      );
      ctx.current.fillStyle = "white"; // Re-apply white background after clearing
      ctx.current.fillRect(
        0,
        0,
        canvasRef.current.width,
        canvasRef.current.height
      );
    }
    elements.forEach((ele) => {
      drawElement(ele, roughCanvas);
    });
  }, [elements]);

  const drawElement = (ele, roughCanvas) => {
    switch (ele.element) {
      case "rect":
        roughCanvas.draw(
          generator.rectangle(ele.offsetX, ele.offsetY, ele.width, ele.height, {
            stroke: ele.stroke,
            roughness: 0,
            strokeWidth: ele.strokeWidth,
          })
        );
        break;
      case "line":
        roughCanvas.draw(
          generator.line(ele.offsetX, ele.offsetY, ele.width, ele.height, {
            stroke: ele.stroke,
            roughness: 0,
            strokeWidth: ele.strokeWidth,
          })
        );
        break;
      case "pencil":
        roughCanvas.linearPath(ele.path, {
          stroke: ele.stroke,
          roughness: 0,
          strokeWidth: ele.strokeWidth,
        });
        break;
      case "circle":
        roughCanvas.draw(
          generator.ellipse(ele.offsetX, ele.offsetY, ele.width, ele.height, {
            stroke: ele.stroke,
            roughness: 0,
            strokeWidth: ele.strokeWidth,
          })
        );
        break;
      case "eraser":
        roughCanvas.linearPath(ele.path, {
          stroke: ele.stroke,
          roughness: 0,
          strokeWidth: ele.strokeWidth,
        });
        break;
      default:
        break;
    }
  };

  const getEventCoordinates = (event) => {
    if (event.touches) {
      // Touch event
      const rect = canvasRef.current.getBoundingClientRect();
      return {
        x: (event.touches[0].clientX - rect.left) * 2,
        y: (event.touches[0].clientY - rect.top) * 2,
      };
    } else {
      // Mouse event
      return {
        x: event.nativeEvent.offsetX * 0.5,
        y: event.nativeEvent.offsetY * 0.5,
      };
    }
  };

  const handleMouseDown = (e) => {
    const { x, y } = getEventCoordinates(e);

    if (tool === "pencil" || tool === "eraser") {
      setElements((prevElements) => [
        ...prevElements,
        {
          offsetX: x,
          offsetY: y,
          path: [[x, y]],
          stroke: tool === "eraser" ? "white" : color,
          element: tool,
          strokeWidth:
            tool === "eraser" ? Math.max(strokeWidth, 30) : strokeWidth,
        },
      ]);
    } else {
      setElements((prevElements) => [
        ...prevElements,
        {
          offsetX: x,
          offsetY: y,
          stroke: color,
          element: tool,
          strokeWidth,
        },
      ]);
    }
    setIsDrawing(true);

    socketRef.current.emit("drawing", {
      roomId,
      action: "start",
      offsetX: x,
      offsetY: y,
      color,
      tool,
      strokeWidth,
    });
  };

  const handleMouseMove = (e) => {
    setEraser({ x: e.clientX, y: e.clientY });

    if (!isDrawing) return;

    const { x, y } = getEventCoordinates(e);

    if (tool === "rect") {
      setElements((prevElements) =>
        prevElements.map((ele, index) =>
          index === elements.length - 1
            ? {
                ...ele,
                width: x - ele.offsetX,
                height: y - ele.offsetY,
              }
            : ele
        )
      );
    } else if (tool === "line") {
      setElements((prevElements) =>
        prevElements.map((ele, index) =>
          index === elements.length - 1
            ? {
                ...ele,
                width: x,
                height: y,
              }
            : ele
        )
      );
    } else if (tool === "pencil" || tool === "eraser") {
      setElements((prevElements) =>
        prevElements.map((ele, index) =>
          index === elements.length - 1
            ? {
                ...ele,
                path: [...ele.path, [x, y]],
              }
            : ele
        )
      );
    } else if (tool === "circle") {
      const radius = Math.sqrt(
        Math.pow(x - elements[elements.length - 1].offsetX, 2) +
          Math.pow(y - elements[elements.length - 1].offsetY, 2)
      );
      setElements((prevElements) =>
        prevElements.map((ele, index) =>
          index === elements.length - 1
            ? {
                ...ele,
                width: 2 * radius,
                height: 2 * radius,
              }
            : ele
        )
      );
    }

    socketRef.current.emit("drawing", {
      roomId,
      action: "move",
      offsetX: x,
      offsetY: y,
    });
  };

  const handleMouseUp = () => {
    setIsDrawing(false);

    socketRef.current.emit("drawing", {
      roomId,
      action: "end",
    });
  };

  const handleRemoteStart = ({
    offsetX,
    offsetY,
    color,
    tool,
    strokeWidth,
  }) => {
    if (tool === "pencil" || tool === "eraser") {
      setElements((prevElements) => [
        ...prevElements,
        {
          offsetX,
          offsetY,
          path: [[offsetX, offsetY]],
          stroke: tool === "eraser" ? "white" : color,
          element: tool,
          strokeWidth:
            tool === "eraser" ? Math.max(strokeWidth, 30) : strokeWidth,
        },
      ]);
    } else {
      setElements((prevElements) => [
        ...prevElements,
        {
          offsetX,
          offsetY,
          stroke: color,
          element: tool,
          strokeWidth,
        },
      ]);
    }
  };

  const handleRemoteMove = ({ offsetX, offsetY }) => {
    if (!isDrawing) return;

    if (tool === "rect") {
      setElements((prevElements) =>
        prevElements.map((ele, index) =>
          index === elements.length - 1
            ? {
                ...ele,
                width: offsetX - ele.offsetX,
                height: offsetY - ele.offsetY,
              }
            : ele
        )
      );
    } else if (tool === "line") {
      setElements((prevElements) =>
        prevElements.map((ele, index) =>
          index === elements.length - 1
            ? {
                ...ele,
                width: offsetX,
                height: offsetY,
              }
            : ele
        )
      );
    } else if (tool === "pencil" || tool === "eraser") {
      setElements((prevElements) =>
        prevElements.map((ele, index) =>
          index === elements.length - 1
            ? {
                ...ele,
                path: [...ele.path, [offsetX, offsetY]],
              }
            : ele
        )
      );
    } else if (tool === "circle") {
      const radius = Math.sqrt(
        Math.pow(offsetX - elements[elements.length - 1].offsetX, 2) +
          Math.pow(offsetY - elements[elements.length - 1].offsetY, 2)
      );
      setElements((prevElements) =>
        prevElements.map((ele, index) =>
          index === elements.length - 1
            ? {
                ...ele,
                width: 2 * radius,
                height: 2 * radius,
              }
            : ele
        )
      );
    }
  };

  const handleRemoteEnd = () => {
    setIsDrawing(false);
  };

  return (
    <div
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      style={{
        height: "100vh",
        width: "100vw",
        overflow: "auto",
        margin: 0,
        padding: 0,
      }}
    >
      <div>
        <label>
          Tool:
          <select value={tool} onChange={(e) => setTool(e.target.value)}>
            <option value="pencil">Pencil</option>
            <option value="line">Line</option>
            <option value="rect">Rectangle</option>
            <option value="circle">Circle</option>
            <option value="eraser">Eraser</option>
          </select>
        </label>
        <label>
          Color:
          <input
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
          />
        </label>
        <label>
          Stroke Width:
          <input
            type="number"
            value={strokeWidth}
            onChange={(e) => setStrokeWidth(Number(e.target.value))}
          />
        </label>
      </div>
      <canvas
        ref={canvasRef}
        id="board"
        className="board"
        style={{ display: "block", background: "white" }}
      />
    </div>
  );
}

export default Whiteboard;
