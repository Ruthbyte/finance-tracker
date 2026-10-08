import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyPassword, setSessionCookie } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const identifier = (
      body.identifier ||
      body.username ||
      body.email ||
      ""
    ).trim();
    const password = body.password || "";

    if (!identifier || !password) {
      return NextResponse.json(
        { error: "Please enter your username/email and password." },
        { status: 400 }
      );
    }

    const user = await db.user.findFirst({
      where: {
        OR: [
          { email: identifier.toLowerCase() },
          {
            username: {
              equals: identifier,
              mode: "insensitive",
            },
          },
        ],
      },
    });

    if (!user || !verifyPassword(password, user.password)) {
      return NextResponse.json(
        { error: "Invalid username/email or password." },
        { status: 401 }
      );
    }

    await setSessionCookie({
      id: user.id,
      username: user.username,
      email: user.email,
    });

    return NextResponse.json({
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        name: user.name || user.username,
        imageUrl: user.imageUrl,
      },
    });
  } catch (error: any) {
    console.error("POST /api/auth/sign-in error:", error);
    return NextResponse.json(
      {
        error:
          error?.message?.includes("Can't reach database")
            ? "Cannot connect to PostgreSQL database. Please ensure the database is running."
            : "Failed to sign in. Please try again.",
      },
      { status: 500 }
    );
  }
}

