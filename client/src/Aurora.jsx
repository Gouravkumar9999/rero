import React, { useEffect, useRef } from 'react';

const Aurora = ({
  colorStops = ["#3A29FF", "#FF94B4", "#FF3232"],
  blend = 0.5,
  amplitude = 1.0,
  speed = 0.5
}) => {
  const canvasRef = useRef(null);
  const timeRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    let width = canvas.width = window.innerWidth;
    let height = canvas.height = window.innerHeight;

    const draw = () => {
      timeRef.current += speed;

      ctx.clearRect(0, 0, width, height);

      // Animate gradient shift using sine wave
      const offset = Math.sin(timeRef.current * 0.01) * amplitude * 60;

      const gradient = ctx.createLinearGradient(offset, 0, width + offset, height);
      const stopCount = colorStops.length;

      colorStops.forEach((color, i) => {
        gradient.addColorStop(i / (stopCount - 1), color);
      });

      ctx.fillStyle = gradient;
      ctx.globalAlpha = blend;
      ctx.fillRect(0, 0, width, height);
      ctx.globalAlpha = 1.0

      requestAnimationFrame(draw);
    };

    draw();

    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [colorStops, blend, amplitude, speed]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        zIndex: -1,
        pointerEvents: "none",
      }}
    />
  );
};

export default Aurora;
