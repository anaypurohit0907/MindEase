import {
  apiRequestDuration,
  apiRequestsCounter,
  tokensProcessedCounter
} from "@/lib/metrics";
import { NextResponse } from "next/server";
import { register } from "prom-client";

export const runtime = 'nodejs';

export async function GET() {
  try {
    // Generate metrics in Prometheus format
    const metrics = await register.metrics();
    
    // Add extra debug information to verify metrics are being collected
    console.log("Metrics being served:", {
      apiRequestsCount: apiRequestsCounter.hashMap,
      apiRequestDuration: apiRequestDuration.hashMap,
      tokensProcessed: tokensProcessedCounter.hashMap
    });
    
    // Return metrics with proper content type for Prometheus
    return new Response(metrics, {
      headers: {
        "Content-Type": "text/plain; version=0.0.4; charset=utf-8",
        "Cache-Control": "no-store, max-age=0",
      },
    });
  } catch (error) {
    console.error("Error generating metrics:", error);
    return NextResponse.json(
      { error: "Failed to generate metrics", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
