import { Button } from "../DemoComponents";
// Remove unused sdk import
// NOTE: Requires @farcaster/mini-apps-react to be installed. If not present, install with:
// npm install @farcaster/mini-apps-react
let useMiniAppContext: any;
try {
  // Dynamically require to avoid breaking non-Farcaster builds
  useMiniAppContext = require("@farcaster/mini-apps-react").useMiniAppContext;
} catch {}

interface ShareFrameButtonProps {
  score: number;
}

export const ShareFrameButton = ({ score }: ShareFrameButtonProps) => {
  const actions = useMiniAppContext ? useMiniAppContext().actions : null;

  const handleShare = async () => {
    const imageUrl = `${window.location.origin}/api/frame-image?score=${encodeURIComponent(score)}`;
    const text = `Check out my score in KissMint Dash! 🏆`;
    if (actions && typeof actions.composeCast === "function") {
      actions.composeCast({
        text,
        media: [
          {
            url: imageUrl,
            mimeType: "image/png"
          }
        ]
      });
    } else {
      // Fallback: copy link or alert
      alert("Sharing is only supported in Farcaster-compatible clients. Please copy and share this image manually: " + imageUrl);
    }
  };

  return (
    <Button variant="secondary" onClick={handleShare}>
      Share on Farcaster
    </Button>
  );
};
