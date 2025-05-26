export const runtime = "nodejs";
import { NextRequest } from "next/server";
import { createCanvas, loadImage, registerFont } from "canvas";

// Register the Press Start 2P arcade font
registerFont(path.resolve(process.cwd(), "public/fonts/PressStart2P-Regular.ttf"), { family: "PressStart2P" });
import path from "path";

// Constants
const WIDTH = 600;
const HEIGHT = 400;
const TEMPLATE_PATH = path.resolve(process.cwd(), "public/share.png");
// const FONT_SIZE = 48; // Unused variable removed to fix ESLint error
const FONT_FAMILY = "PressStart2P"; // Arcade font for retro look
const SCORE_COLOR = "#48ffb4"; // Mint green
const SCORE_X = 30; // Top left corner
const SCORE_Y = 60;

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const score = searchParams.get("score") || "?";

  // Load template image
  let template;
  try {
    template = await loadImage(TEMPLATE_PATH);
  } catch {
    return new Response("Could not load template image", { status: 500 });
  }

  // Prepare canvas
  const canvas = createCanvas(WIDTH, HEIGHT);
  const ctx = canvas.getContext("2d");
  ctx.drawImage(template, 0, 0, WIDTH, HEIGHT);

  // Draw 'High Score' label in yellow with black outline and drop-shadow
  ctx.font = `bold 36px ${FONT_FAMILY}`;
  ctx.lineWidth = 1;
  ctx.strokeStyle = "#000";
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  ctx.shadowColor = "#000";
  ctx.shadowBlur = 8;
  ctx.strokeText("High Score", SCORE_X, SCORE_Y);
  ctx.fillStyle = "#ffe14b"; // Yellow
  ctx.fillText("High Score", SCORE_X, SCORE_Y);

  // Draw the score below with black outline and drop-shadow
  ctx.font = `bold 64px ${FONT_FAMILY}`;
  ctx.lineWidth = 1;
  ctx.strokeStyle = "#000";
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  ctx.shadowColor = "#000";
  ctx.shadowBlur = 8;
  ctx.strokeText(score.toString(), SCORE_X + 64, SCORE_Y + 44);
  ctx.fillStyle = SCORE_COLOR;
  ctx.fillText(score.toString(), SCORE_X + 64, SCORE_Y + 44);

  // Output image
  const buffer = canvas.toBuffer("image/png");
  return new Response(buffer, {
    status: 200,
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "public, max-age=3600"
    }
  });
}
