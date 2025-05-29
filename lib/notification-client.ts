import { sdk } from "@farcaster/frame-sdk";
import { FrameNotificationDetails } from "@farcaster/frame-sdk";

type SendFrameNotificationResult =
  | {
      state: "error";
      error: unknown;
    }
  | { state: "no_token" }
  | { state: "success" };

export async function sendFrameNotification({
  fid,
  title,
  body,
  notificationDetails,
}: {
  fid: number;
  title: string;
  body: string;
  notificationDetails?: FrameNotificationDetails | null;
}): Promise<SendFrameNotificationResult> {
  if (!notificationDetails) {
    return { state: "no_token" };
  }

  try {
    // Use the Farcaster SDK to send a notification
    await sdk.actions.composeCast({
      text: `${title}: ${body}`,
      embeds: [],
    });

    return { state: "success" };
  } catch (error) {
    console.error("Failed to send notification:", error);
    return { 
      state: "error", 
      error: error instanceof Error ? error.message : "Failed to send notification" 
    };
  }
}
