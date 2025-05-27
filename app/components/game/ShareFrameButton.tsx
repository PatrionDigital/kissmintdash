import { Button } from "../DemoComponents";
import { FarcasterArchIcon } from "../icons/FarcasterArchIcon";

interface ShareFrameButtonProps {
  score: number;
  disabled?: boolean;
  className?: string;
}

export const ShareFrameButton = ({ 
  score, 
  disabled = false, 
  className = '' 
}: ShareFrameButtonProps) => {
  const handleShare = () => {
    const text = encodeURIComponent(`Check out my score in KissMint Dash! 🏆`);
    const imageUrl = encodeURIComponent(`${window.location.origin}/api/frame-image?score=${score}`);
    const url = `https://farcaster.xyz/~/compose?text=${text}&embeds[]=${imageUrl}`;
    window.open(url, "_blank");
  };

  return (
    <Button 
      variant="secondary" 
      onClick={handleShare}
      disabled={disabled}
      className={`text-white ${className} flex items-center justify-center gap-2`}
    >
      <FarcasterArchIcon className="text-white" />
      <span>Share on Farcaster</span>
    </Button>
  );
};
