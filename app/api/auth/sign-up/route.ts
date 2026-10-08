import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  hashPassword,
  setSessionCookie,
  INITIAL_USER_SEED,
} from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const rawUsername = (body.username || "").trim();
    const rawEmail = (body.email || "").trim().toLowerCase();
    const password = body.password || "";
    const confirmPassword = body.confirmPassword;
    const rawName = (body.name || "").trim();

    if (!rawUsername || !rawEmail || !password) {
      return NextResponse.json(
        { error: "Username, email, and password are required." },
        { status: 400 }
      );
    }

    if (confirmPassword !== undefined && password !== confirmPassword) {
      return NextResponse.json(
        { error: "Passwords do not match." },
        { status: 400 }
      );
    }

    if (rawUsername.length < 3) {
      return NextResponse.json(
        { error: "Username must be at least 3 characters long." },
        { status: 400 }
      );
    }

    if (!/^[a-zA-Z0-9_.-]+$/.test(rawUsername)) {
      return NextResponse.json(
        {
          error:
            "Username may only contain letters, numbers, underscores, dots, and hyphens.",
        },
        { status: 400 }
      );
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(rawEmail)) {
      return NextResponse.json(
        { error: "Please enter a valid email address." },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters long." },
        { status: 400 }
      );
    }

    // Check existing user by email first
    const existingByEmail = await db.user.findUnique({
      where: { email: rawEmail },
    });

    if (existingByEmail && existingByEmail.password !== "") {
      return NextResponse.json(
        { error: "An account with this email already exists." },
        { status: 409 }
      );
    }

    // Check existing user by username (excluding the legacy account being claimed)
    const existingByUsername = await db.user.findFirst({
      where: {
        username: {
          equals: rawUsername,
          mode: "insensitive",
        },
        ...(existingByEmail ? { NOT: { id: existingByEmail.id } } : {}),
      },
    });

    if (existingByUsername) {
      return NextResponse.json(
        { error: "This username is already taken." },
        { status: 409 }
      );
    }

    const passwordHash = hashPassword(password);

    const newUser = existingByEmail
      ? await db.user.update({
          where: { id: existingByEmail.id },
          data: {
            username: rawUsername,
            password: passwordHash,
            name: rawName || existingByEmail.name || rawUsername,
          },
        })
      : await db.user.create({
          data: {
            username: rawUsername,
            email: rawEmail,
            password: passwordHash,
            name: rawName || rawUsername,
            ...INITIAL_USER_SEED,
          },
        });

    await setSessionCookie({
      id: newUser.id,
      username: newUser.username,
      email: newUser.email,
    });

    return NextResponse.json(
      {
        user: {
          id: newUser.id,
          username: newUser.username,
          email: newUser.email,
          name: newUser.name,
          imageUrl: newUser.imageUrl,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("POST /api/auth/sign-up error:", error);
    return NextResponse.json(
      {
        error:
          error?.message?.includes("Can't reach database")
            ? "Cannot connect to PostgreSQL database. Please ensure the database is running."
            : "Failed to create account. Please try again.",
      },
      { status: 500 }
    );
  }
}

