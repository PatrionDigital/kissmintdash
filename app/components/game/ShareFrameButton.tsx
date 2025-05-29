import { Button } from "../DemoComponents";
import { sdk } from "@farcaster/frame-sdk";

interface ShareFrameButtonProps {
  score?: number;
  disabled?: boolean;
  className?: string;
  onShareComplete?: () => void;
}

export const ShareFrameButton = ({ 
  score = 0, 
  disabled = false, 
  className = '',
  onShareComplete
}: ShareFrameButtonProps) => {
  const handleShare = async () => {
    if (!sdk?.actions?.composeCast) {
      console.error('Farcaster composeCast API not available');
      return;
    }

    const trophyEmoji = String.fromCodePoint(0x1F3C6); // 🏆
    const appUrl = 'https://farcaster.xyz/miniapps/h41-FxJhcLVK/kissmintdash';
    const text = `Check out my score in KissMint Dash! ${trophyEmoji}\n\n${appUrl}`;
    const imageUrl = `${process.env.NEXT_PUBLIC_URL}/api/frame-image?score=${score}`;
    
    try {
      const result = await sdk.actions.composeCast({
        text,
        embeds: [imageUrl],
      });
      
      // If cast was successful, call the completion callback
      if (result?.cast) {
        onShareComplete?.();
      } else {
        console.log('User canceled the cast');
      }
    } catch (error) {
      console.error('Error sharing to Farcaster:', error);
    }
  };

  return (
    <Button 
      variant="secondary" 
      onClick={handleShare}
      disabled={disabled}
      className={`text-white ${className} flex items-center justify-center gap-2`}
    >
      <i className="fc fc-square-farcaster text-lg"></i>
      <span>Share on Farcaster</span>
    </Button>
  );
};
