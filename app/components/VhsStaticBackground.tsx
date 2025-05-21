"use client";
import React, { useEffect, useRef, useCallback } from "react";

/**
 * Renders a fullscreen, fixed VHS static effect using a canvas.
 * The canvas is styled to cover the viewport and sit behind all content.
 */
const VhsStaticBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Draw one frame of static
  const drawStatic = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const { width, height } = canvas;
    const imageData = ctx.createImageData(width, height);
    const data = imageData.data;
    for (let i = 0; i < data.length; i += 4) {
      const randomValue = Math.random() * 255;
      data[i] = randomValue;     // Red
      data[i + 1] = randomValue; // Green
      data[i + 2] = randomValue; // Blue
      data[i + 3] = 255;         // Alpha
    }
    ctx.putImageData(imageData, 0, 0);

    // --- Vignette Effect ---
    // Draw a radial gradient overlay for CRT tube look
    const vignette = ctx.createRadialGradient(
      width / 2, height / 2, Math.min(width, height) * 0.2,
      width / 2, height / 2, Math.max(width, height) / 1
    );
    vignette.addColorStop(0, 'rgba(0,0,0,0)');
    vignette.addColorStop(0.35, 'rgba(0,0,0,0.45)');
    vignette.addColorStop(0.7, 'rgba(0,0,0,0.85)');
    vignette.addColorStop(1, 'rgba(0,0,0,1)');
    ctx.save();
    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, width, height);
    ctx.restore();
  }, []);

  // Animate static
  useEffect(() => {
    let animationFrameId: number;
    function animateStatic() {
      drawStatic();
      animationFrameId = window.requestAnimationFrame(animateStatic);
    }
    animateStatic();
    return () => cancelAnimationFrame(animationFrameId);
  }, [drawStatic]);

  // Resize canvas to fill viewport
  useEffect(() => {
    function handleResize() {
      const canvas = canvasRef.current;
      if (!canvas) return;
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <canvas
      ref={canvasRef}
      id="vhsCanvas"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        zIndex: 0,
        pointerEvents: "none",
        opacity: 1,
        filter: "contrast(1.2) blur(0.5px)",
        background: "black"
      }}
    />
  );
};

export default VhsStaticBackground;
