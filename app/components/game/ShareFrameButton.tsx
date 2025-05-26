import { Button } from "../DemoComponents";
import { sdk } from "@farcaster/frame-sdk";

interface ShareFrameButtonProps {
  score: number;
}

export const ShareFrameButton = ({ score }: ShareFrameButtonProps) => {
  const handleShare = async () => {
    const metadataUrl = `/api/frame-metadata?score=${encodeURIComponent(score)}`;
    const fullUrl = window.location.origin + metadataUrl;
    if (sdk && sdk.actions && typeof sdk.actions.openUrl === "function") {
      await sdk.actions.openUrl(fullUrl);
    } else {
      alert("Sharing is only supported in Farcaster-compatible clients. Please copy and share this link manually: " + fullUrl);
    }
  };

  return (
    <Button variant="secondary" onClick={handleShare}>
      Share on Farcaster
    </Button>
  );
};
