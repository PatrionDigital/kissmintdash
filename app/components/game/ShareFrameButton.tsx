import { Button } from "../DemoComponents";
import { FarcasterArchIcon } from "../icons/FarcasterArchIcon";
import { sdk } from "@farcaster/frame-sdk";

interface ShareFrameButtonProps {
  score: number;
  disabled?: boolean;
  className?: string;
}

// Extend the Window interface to include Farcaster SDK properties
interface WindowWithFarcaster extends Window {
  farcaster?: {
    // From @farcaster/frame-sdk
    actions?: {
      composeCast: (params: {
        text: string;
        embeds?: string[];
        parent?: { type: string; hash: string };
        channelKey?: string;
      }) => Promise<{ cast: { hash: string; channelKey?: string } | null }>;
    };
    // Add other Farcaster SDK methods as needed
  };
}

declare let window: WindowWithFarcaster;

// Check if we're running in a Farcaster frame
const isFarcasterFrame = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  try {
    return window.self !== window.top;
  } catch {
    // If we can't access window.top, we're probably in a frame
    return true;
  }
};

export const ShareFrameButton = ({ 
  score, 
  disabled = false, 
  className = '' 
}: ShareFrameButtonProps) => {
  const handleShare = async () => {
    const trophyEmoji = String.fromCodePoint(0x1F3C6); // 🏆
    const text = `Check out my score in KissMint Dash! ${trophyEmoji}`;
    const imageUrl = `${window.location.origin}/api/frame-image?score=${score}`;
    
    if (isFarcasterFrame() && typeof window.farcaster !== 'undefined') {
      // Running in Farcaster frame
      try {
        await sdk.actions.composeCast({
          text,
          embeds: [imageUrl] as [string],
        });
        return;
      } catch (error) {
        console.error('Error sharing to Farcaster:', error);
        // Continue to fallback if there's an error
      }
    }
    
    // Fallback for web or if Farcaster sharing fails
    const fallbackText = encodeURIComponent(text);
    const fallbackImageUrl = encodeURIComponent(imageUrl);
    window.open(
      `https://farcaster.xyz/~/compose?text=${fallbackText}&embeds[]=${fallbackImageUrl}`,
      '_blank',
      'noopener,noreferrer'
    );
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
