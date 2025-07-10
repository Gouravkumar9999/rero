import React, { useEffect, useState, useRef, useCallback, forwardRef, useImperativeHandle } from "react";
import Editor from "@monaco-editor/react";
import { motion } from "framer-motion";
import VideoStream from "./VideoStream";
import editorOptions from "./editorOptions.json";

// --- ResizablePanel component ---
function ResizablePanel({
  minWidth = 240,
  minHeight = 180,
  initialWidth = 400,
  initialHeight = 300,
  children,
  title,
  className = "",
}) {
  const panelRef = useRef();
  const [size, setSize] = useState({ width: initialWidth, height: initialHeight });
  const [dragging, setDragging] = useState(false);
  const [origin, setOrigin] = useState({ x: 0, y: 0 });

  const onMouseDown = (e) => {
    e.preventDefault();
    setDragging(true);
    setOrigin({ x: e.clientX, y: e.clientY });
  };

  useEffect(() => {
    if (!dragging) return;
    const onMove = (e) => {
      setSize((prev) => ({
        width: Math.max(minWidth, prev.width + (e.clientX - origin.x)),
        height: Math.max(minHeight, prev.height + (e.clientY - origin.y)),
      }));
      setOrigin({ x: e.clientX, y: e.clientY });
    };
    const onUp = () => setDragging(false);
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
    // eslint-disable-next-line
  }, [dragging, origin]);

  return (
    <div
      ref={panelRef}
      className={`relative bg-gray-900 dark:bg-gray-900/80 rounded-lg shadow-lg border border-cyan-400/30 overflow-hidden flex flex-col ${className}`}
      style={{
        width: size.width,
        height: size.height,
        resize: "none",
        minWidth,
        minHeight,
        transition: dragging ? "none" : "box-shadow 0.2s",
        zIndex: 10,
      }}
    >
      <div className="font-bold px-4 py-2 border-b border-cyan-400/20 bg-cyan-50/10 dark:bg-cyan-900/40 text-cyan-200 select-none">
        {title}
      </div>
      <div className="flex-1 overflow-auto">{children}</div>
      {/* Drag handle (bottom-right) */}
      <div
        onMouseDown={onMouseDown}
        className="absolute right-1 bottom-1 w-4 h-4 cursor-nwse-resize bg-cyan-400/80 rounded-sm flex items-end justify-end"
        style={{ zIndex: 20 }}
        title="Resize"
      >
        <svg width="14" height="14" viewBox="0 0 14 14"><path d="M2 12h10V2" stroke="#fff" strokeWidth="2" fill="none"/></svg>
      </div>
    </div>
  );
}

// --- Token helper ---
function getToken(user) {
  return user?.token || JSON.parse(localStorage.getItem("user"))?.token;
}

const UploaderPage = forwardRef(({ user }, ref) => {
  // --- Slot Access Logic ---
  const [allowed, setAllowed] = useState(false);
  const [checked, setChecked] = useState(false);
  const intervalRef = useRef();

  // --- Editor/Upload Logic ---
  const editorRef = useRef(null);
  const [code, setCode] = useState("// Write your Arduino C++ code here\nvoid setup() {\n  Serial.begin(9600);\n}\n\nvoid loop() {\n  Serial.println(\"Hello, world!\");\n  delay(1000);\n}");
  const [logs, setLogs] = useState([]);
  const [socket, setSocket] = useState(null);

  // --- Slot Access Check ---
  const checkAccess = useCallback(async () => {
    let token = getToken(user);
    if (!token) return;
    try {
      const res = await fetch("http://localhost:8000/validate-slot-access", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setAllowed(!!data.access);
    } catch (err) {
      setAllowed(false);
    } finally {
      setChecked(true);
    }
  }, [user]);

  useImperativeHandle(ref, () => ({
    checkAccess,
  }));

  useEffect(() => {
    checkAccess();
    intervalRef.current = setInterval(() => {
      checkAccess();
    }, 30000);
    return () => clearInterval(intervalRef.current);
  }, [checkAccess]);

  // --- WebSocket Setup ---
  useEffect(() => {
    if (!allowed) return;

    // Always connect with token for auth
    const token = getToken(user);
    if (!token) return;

    const wsUrl = `ws://localhost:8000/arduino/ws?token=${token}`;
    const newSocket = new window.WebSocket(wsUrl);

    newSocket.onopen = () => {
      setLogs((prevLogs) => [...prevLogs, "WebSocket connected"]);
    };

    newSocket.onmessage = (event) => {
      setLogs((prevLogs) => [...prevLogs, event.data]);
    };

    newSocket.onclose = () => {
      setLogs((prevLogs) => [...prevLogs, "WebSocket disconnected"]);
    };

    newSocket.onerror = (error) => {
      setLogs((prevLogs) => [...prevLogs, "WebSocket error: " + error]);
    };

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
    // Only recreate socket when allowed changes
    // eslint-disable-next-line
  }, [allowed, user]);

  // --- Editor Mount Handler ---
  const handleEditorDidMount = (editor) => {
    editorRef.current = editor;
  };

  // --- Upload Button Handler ---
  const handleUpload = () => {
    if (!socket || socket.readyState !== 1) {
      setLogs((prevLogs) => [...prevLogs, "WebSocket not connected"]);
      return;
    }
    setLogs((prevLogs) => [...prevLogs, "Upload functionality triggered..."]);
    socket.send(editorRef.current?.getValue());
  };

  // --- Compile Button Handler ---
  const handleCompile = async () => {
    setLogs((prevLogs) => [...prevLogs, "Compile functionality triggered..."]);
    try {
      const token = getToken(user);
      const response = await fetch("http://localhost:8000/arduino/compile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ code: editorRef.current?.getValue() }),
      });

      const data = await response.json();
      if (response.ok) {
        setLogs((prevLogs) => [...prevLogs, "Compilation successful!"]);
        if (data.warnings) {
          setLogs((prevLogs) => [...prevLogs, "Warnings: " + data.warnings]);
        }
      } else {
        setLogs((prevLogs) => [...prevLogs, "Compilation failed: " + data.detail]);
      }
    } catch (error) {
      setLogs((prevLogs) => [...prevLogs, "Error: " + error.message]);
    }
  };

  // --- Access Control UI ---
  if (!checked) return <p className="text-lg text-cyan-300 py-8 text-center">Validating access...</p>;
  if (!allowed) return <p className="text-lg text-red-400 py-8 text-center">⛔ Access Denied: Your booked slot has not started yet.</p>;

  // --- Render Editor, Video, Logs in three resizable panels ---
  return (
    <motion.div
    className="min-h-screen bg-white text-gray-900 dark:bg-gray-950 dark:text-white p-6 transition-colors duration-300"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <h1 className="text-3xl font-bold mb-6 text-center text-gray-900 dark:text-gray-100">Arduino Uploader</h1>
      <div className="flex flex-wrap gap-7 justify-center items-start w-full">
        {/* Video Panel */}
        <ResizablePanel
          title="Live Camera Stream"
          initialWidth={640}
          initialHeight={750}
          minWidth={240}
          minHeight={180}
        >
          <div className="w-full h-full flex items-center justify-center bg-black">
            <VideoStream wsUrl="ws://localhost:8000/ws/video" fps={24} quality={60} />
          </div>
        </ResizablePanel>

        {/* Editor Panel */}
        <ResizablePanel
          title="Code Editor"
          initialWidth={750}
          initialHeight={750}
          minWidth={320}
          minHeight={180}
        >
          <div className="flex flex-col h-full">
            <Editor
              height="100%"
              width="100%"
              defaultLanguage="cpp"
              value={code}
              theme="vs-dark"
              options={editorOptions}
              onMount={handleEditorDidMount}
              onChange={(value) => {
                if (value !== undefined) setCode(value);
              }}
            />
           <div className="flex justify-end p-2 gap-2">
              <button
                onClick={handleUpload}
                className={`px-4 py-2 rounded font-bold shadow transition
                  bg-teal-600 hover:bg-teal-700 text-white
                  dark:bg-teal-500 dark:hover:bg-teal-400`}
                disabled={!socket || socket.readyState !== 1}
              >
                Upload
              </button>
              <button
                onClick={handleCompile}
                className={`px-4 py-2 rounded font-bold shadow transition
                  bg-yellow-500 hover:bg-yellow-600 text-black
                  dark:bg-yellow-400 dark:hover:bg-yellow-300`}
              >
                Compile
              </button>
            </div>

          </div>
        </ResizablePanel>

        {/* Logs Panel */}
        <ResizablePanel
          title="Logs"
          initialWidth={1032}
          initialHeight={300}
          minWidth={200}
          minHeight={120}
        >
       <div className="bg-gray-100 dark:bg-slate-900 text-gray-800 dark:text-cyan-200 p-2 h-full w-full font-mono text-sm overflow-auto whitespace-pre-wrap transition-colors">
            {logs.length === 0
              ? <span>No logs yet.</span>
              : logs.slice(-200).map((log, i) => <div key={i}>{log}</div>)
            }
          </div>
        </ResizablePanel>
      </div>
    </motion.div>
  );
});

export default UploaderPage;