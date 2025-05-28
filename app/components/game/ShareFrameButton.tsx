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
    isInMiniApp: (timeoutMs?: number) => Promise<boolean>;
    actions?: {
      composeCast: (params: {
        text: string;
        embeds?: string[];
        parent?: { type: string; hash: string };
        channelKey?: string;
      }) => Promise<{ cast: { hash: string; channelKey?: string } | null } | undefined>;
    };
  };
}

declare let window: WindowWithFarcaster;

const openFallbackShare = (text: string, imageUrl: string) => {
  const fallbackText = encodeURIComponent(text);
  const fallbackImageUrl = encodeURIComponent(imageUrl);
  window.open(
    `https://farcaster.xyz/~/compose?text=${fallbackText}&embeds[]=${fallbackImageUrl}`,
    '_blank',
    'noopener,noreferrer'
  );
};

export const ShareFrameButton = ({ 
  score, 
  disabled = false, 
  className = '' 
}: ShareFrameButtonProps) => {
  const handleShare = async () => {
    const trophyEmoji = String.fromCodePoint(0x1F3C6); // 🏆
    const appUrl = 'https://farcaster.xyz/miniapps/h41-FxJhcLVK/kissmintdash';
    const text = `Check out my score in KissMint Dash! ${trophyEmoji}\n\n${appUrl}`;
    const imageUrl = `${window.location.origin}/api/frame-image?score=${score}`;
    
    try {
      // Check if we're in a Farcaster Mini App
      const isMiniApp = await sdk.isInMiniApp?.() ?? false;
      
      if (isMiniApp && window.farcaster?.actions?.composeCast) {
        try {
          // Running in Farcaster Mini App
          const result = await window.farcaster.actions.composeCast({
            text,
            embeds: [imageUrl] as [string],
          });
          
          // If user canceled the cast (result is undefined) or cast is null, fall back to web
          if (result === undefined || result.cast === null) {
            openFallbackShare(text, imageUrl);
          }
          return;
        } catch (error) {
          console.error('Error in composeCast:', error);
          // Continue to fallback if there's an error
        }
      }
      
      // If not in Mini App or composeCast not available, use fallback
      openFallbackShare(text, imageUrl);
    } catch (error) {
      console.error('Error sharing to Farcaster:', error);
      // Fallback to web sharing on error
      openFallbackShare(text, imageUrl);
    }
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
