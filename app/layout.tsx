import "./theme.css";
import "@coinbase/onchainkit/styles.css";
import type { Metadata, Viewport } from "next";
import "./globals.css";
import "../public/farcaster/style.css"; // Import Farcaster icon styles
import { Providers } from "./providers";
import dynamic from 'next/dynamic';
// import AudioInitializer from "./components/AudioInitializer"; // Replaced with dynamic import
import { UserProfileProvider } from "./context/UserContext";
import { GameProvider } from "./context/GameContext";
import VhsStaticBackground from "./components/VhsStaticBackground";
import { Toaster } from "sonner";
// import AudioPlayer from "./components/AudioPlayer"; // Replaced with dynamic import

const DynamicAudioInitializer = dynamic(() => import('./components/AudioInitializer'), { 
  ssr: false,
  // No loading UI for initializer as it's non-visual
});


export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export async function generateMetadata(): Promise<Metadata> {
  // Hardcoded values for Farcaster Frame
  const frameData = {
    version: "next",
    imageUrl: "https://kissmintdash.vercel.app/hero.png",
    button: {
      title: "Play KISS MINT Dash",
      action: {
        type: "launch_frame",
        name: "KissMINT Dash",
        url: "https://kissmintdash.vercel.app",
        splashImageUrl: "https://kissmintdash.vercel.app/splash.png",
        splashBackgroundColor: "#000000"
      },
    },
  };

  // Stringify the frame data with proper escaping
  const frameString = JSON.stringify(frameData)
    .replace(/</g, '\\u003c')  // Escape <
    .replace(/>/g, '\\u003e')  // Escape >
    .replace(/&/g, '\\u0026'); // Escape &


  return {
    title: "KissMINT Dash",
    description: "Tap Fast, Run Far, Mint Glory. Compete for glory in 25 seconds.",
    other: {
      "fc:frame": frameString,
    },
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        <link rel="manifest" href="https://kissmintdash.vercel.app/site.webmanifest" />
      </head>
      <body className="bg-background">
        {/* VHS Static Canvas Background */}
        <VhsStaticBackground />
        <UserProfileProvider>
          <GameProvider>
            <Providers>
              <DynamicAudioInitializer />
              {children}
              <Toaster position="bottom-center" />
            </Providers>
          </GameProvider>
        </UserProfileProvider>
        {/* Global Audio Player Controls Removed */}
      </body>
    </html>
  );
}
