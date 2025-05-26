import { Button } from "../DemoComponents";

interface ShareFrameButtonProps {
  score: number;
}

export const ShareFrameButton = ({ score }: ShareFrameButtonProps) => {
  const handleShare = () => {
    const text = encodeURIComponent(`Check out my score in KissMint Dash! 🏆`);
    const imageUrl = encodeURIComponent(`${window.location.origin}/api/frame-image?score=${score}`);
    const url = `https://farcaster.xyz/~/compose?text=${text}&embeds[]=${imageUrl}`;
    window.open(url, "_blank");
  };

  return (
    <Button variant="secondary" onClick={handleShare}>
      Share on Farcaster
    </Button>
  );
};
