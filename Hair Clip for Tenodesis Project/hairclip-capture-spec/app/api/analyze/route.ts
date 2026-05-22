import { NextRequest, NextResponse } from "next/server";
import { analysisApiBase } from "@/lib/config";

export async function POST(request: NextRequest) {
  const payload = await request.json();

  try {
    const upstream = await fetch(`${analysisApiBase}/analyze`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "bypass-tunnel-reminder": "true",
      },
      body: JSON.stringify(payload),
      cache: "no-store",
    });

    const text = await upstream.text();

    return new NextResponse(text, {
      status: upstream.status,
      headers: {
        "Content-Type": upstream.headers.get("content-type") ?? "application/json",
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Upstream analysis service is unreachable.",
        upstream: analysisApiBase,
      },
      { status: 502 },
    );
  }
}
