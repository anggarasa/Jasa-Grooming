import { NextRequest, NextResponse } from "next/server";
import { processGoogleWebhook, WebhookValidationError } from "@backend/modules/integrations/google/google-webhook.service";

export async function POST(request: NextRequest) {
  try {
    const channelId = request.headers.get("x-goog-channel-id") || undefined;
    const resourceId = request.headers.get("x-goog-resource-id") || undefined;
    const resourceState = request.headers.get("x-goog-resource-state") || undefined;
    const channelToken = request.headers.get("x-goog-channel-token") || undefined;

    const result = await processGoogleWebhook({
      channelId,
      resourceId,
      resourceState,
      channelToken,
    });

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    if (error instanceof WebhookValidationError) {
      console.warn(`[GoogleWebhookRoute] Webhook validation failed: ${error.message}`);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: error.statusCode }
      );
    }

    console.error("[GoogleWebhookRoute] Unhandled webhook error:", error);
    // Still return 200/500 depending on nature, but for Google webhook return 500 so Google can retry if internal error
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
