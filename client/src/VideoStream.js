import React, { useEffect, useRef, useState } from "react";

export default function VideoStream({ wsUrl = "ws://localhost:8000/ws/video", fps = 24, quality = 60 }) {
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState("");
  const imgRef = useRef();
  const wsRef = useRef();

  useEffect(() => {
    // Open WebSocket and send initial config
    const ws = new window.WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      setConnected(true);
      setError("");
      ws.send(JSON.stringify({ fps, quality }));
    };

    ws.onmessage = (event) => {
      // Received JPEG binary
      if (imgRef.current) {
        const blob = new Blob([event.data], { type: "image/jpeg" });
        imgRef.current.src = URL.createObjectURL(blob);
      }
    };

    ws.onerror = (e) => {
      setError("WebSocket error: " + e.message);
      setConnected(false);
    };

    ws.onclose = () => {
      setConnected(false);
    };

    return () => ws.close();
    // eslint-disable-next-line
  }, [wsUrl, fps, quality]);

  return (
    <div className="flex flex-col items-center">
      <div className="mb-2">
        <span className={connected ? "text-green-500" : "text-red-400"}>
          {connected ? "● Live" : "● Offline"}
        </span>
        {error && <span className="ml-4 text-red-400">{error}</span>}
      </div>
      <img ref={imgRef} alt="Live video stream" className="rounded border shadow-lg w-[640px] h-[360px] bg-black object-contain" />
    </div>
  );
}