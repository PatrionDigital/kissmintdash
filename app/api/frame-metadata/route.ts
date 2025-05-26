import { NextRequest } from "next/server";

// This endpoint returns Farcaster frame metadata for sharing
// Example usage: /api/frame-metadata?score=123

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const score = searchParams.get("score") || "?";

  // The image URL points to our frame-image endpoint
  const imageUrl = `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/api/frame-image?score=${encodeURIComponent(score)}`;

  // Farcaster frame metadata
  const metadata = {
    version: "vNext",
    image: imageUrl,
    title: `My High Score: ${score}!`,
    description: `Can you beat my score in KissMint Dash? Play now!`,
    buttons: [
      {
        label: "Play Now",
        action: "link",
        target: process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"
      }
    ]
  };

  return new Response(JSON.stringify(metadata), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "public, max-age=60"
    }
  });
}
