export const runtime = "nodejs";
import { NextRequest } from "next/server";
import { createCanvas, loadImage } from "canvas";
import path from "path";

// Constants
const WIDTH = 600;
const HEIGHT = 400;
const TEMPLATE_PATH = path.resolve(process.cwd(), "public/share.png");
// const FONT_SIZE = 48; // Unused variable removed to fix ESLint error
const FONT_FAMILY = "Arial"; // Change if you want a custom font
const SCORE_COLOR = "#fff";
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

  // Draw 'High Score' label
  ctx.font = `bold 36px ${FONT_FAMILY}`;
  ctx.fillStyle = SCORE_COLOR;
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  ctx.shadowColor = "#000";
  ctx.shadowBlur = 8;
  ctx.fillText("High Score", SCORE_X, SCORE_Y);

  // Draw the score below
  ctx.font = `bold 64px ${FONT_FAMILY}`;
  ctx.fillStyle = SCORE_COLOR;
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  ctx.shadowColor = "#000";
  ctx.shadowBlur = 12;
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
