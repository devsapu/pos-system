import { NextRequest, NextResponse } from "next/server";

const GAS_URL = process.env.NEXT_PUBLIC_API_URL?.trim();

const ensureGasUrl = (): string => {
  if (!GAS_URL) {
    throw new Error("Missing NEXT_PUBLIC_API_URL");
  }
  return GAS_URL;
};

export async function GET(request: NextRequest) {
  try {
    const action = request.nextUrl.searchParams.get("action");
    if (!action) {
      return NextResponse.json({ ok: false, message: "Missing action" }, { status: 400 });
    }

    const target = new URL(ensureGasUrl());
    target.searchParams.set("action", action);

    const response = await fetch(target.toString(), { method: "GET", cache: "no-store" });
    const text = await response.text();
    return new NextResponse(text, {
      status: response.status,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    return NextResponse.json(
      { ok: false, message: error instanceof Error ? error.message : "Proxy GET failed" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const action = String(body.action || "");
    if (!action) {
      return NextResponse.json({ ok: false, message: "Missing action" }, { status: 400 });
    }

    const target = new URL(ensureGasUrl());
    target.searchParams.set("action", action);

    const response = await fetch(target.toString(), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      cache: "no-store",
    });

    const text = await response.text();
    return new NextResponse(text, {
      status: response.status,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    return NextResponse.json(
      { ok: false, message: error instanceof Error ? error.message : "Proxy POST failed" },
      { status: 500 },
    );
  }
}
