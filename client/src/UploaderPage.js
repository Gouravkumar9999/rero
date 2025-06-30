import React, { useEffect, useState, useRef, useCallback, forwardRef, useImperativeHandle } from "react";
import Editor from "@monaco-editor/react";
import { motion } from "framer-motion";
import editorOptions from "./editorOptions.json";

// Move getToken OUTSIDE the component so it is stable and does not trigger hook warnings
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
      console.log("[WebSocket Received]:", event.data);  
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
    setLogs(["Upload functionality triggered..."]);
    socket.send(editorRef.current?.getValue());
  };

  // --- Compile Button Handler ---
  const handleCompile = async () => {
    setLogs(["Compile functionality triggered..."]);
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
      setLogs([]);
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
  if (!checked) return <p>Validating access...</p>;
  if (!allowed) return <p>⛔ Access Denied: Your booked slot has not started yet.</p>;

  // --- Render Editor UI ---
  return (
    <motion.div
      className="min-h-screen bg-gray-950 text-white p-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <h1 className="text-3xl font-bold mb-6 text-center text-teal-400">Arduino Uploader</h1>

      <div className="max-w-6xl mx-auto bg-gray-900 rounded-2xl shadow-2xl overflow-hidden">
        <Editor
          height="60vh"
          defaultLanguage="cpp"
          theme="vs-dark"
          value={code}
          onMount={handleEditorDidMount}
          onChange={(value) => {
            if (value !== undefined) {
              setCode(value);
            }
          }}
          options={editorOptions}
        />
      </div>

      <div className="flex justify-center gap-6 mt-6">
        <button
          className="bg-teal-500 hover:bg-teal-600 text-white px-6 py-2 rounded-2xl shadow-md text-lg transition-colors"
          onClick={handleUpload}
        >
          Upload
        </button>
        <button
          className="bg-indigo-500 hover:bg-indigo-600 text-white px-6 py-2 rounded-2xl shadow-md text-lg transition-colors"
          onClick={handleCompile}
        >
          Compile
        </button>
      </div>

      {/* Logs Display */}
      <div className="max-w-6xl mx-auto mt-8 bg-white text-black rounded-2xl shadow-2xl overflow-hidden border border-gray-300">
  <div className="p-4">
    <h2 className="text-xl font-semibold mb-2 text-white-800">Logs:</h2>
    <div className="bg-gray-100 text-sm font-mono whitespace-pre-wrap break-words overflow-y-auto max-h-64 p-4 rounded-xl border border-gray-300">
      {logs.map((log, index) => (
        <p key={index}>{log}</p>
      ))}
    </div>
  </div>
</div>
    </motion.div>
  );
});

export default UploaderPage;