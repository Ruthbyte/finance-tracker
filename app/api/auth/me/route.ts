import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  getCurrentUser,
  hashPassword,
  verifyPassword,
  setSessionCookie,
} from "@/lib/auth";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ user: null }, { status: 401 });
    }

    return NextResponse.json({
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        name: user.name || user.username,
        imageUrl: user.imageUrl,
      },
    });
  } catch (error) {
    console.error("GET /api/auth/me error:", error);
    return NextResponse.json(
      { error: "Failed to fetch user session" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();

    // Handle password change
    if (body.action === "CHANGE_PASSWORD") {
      const { currentPassword, newPassword } = body;
      if (!currentPassword || !newPassword) {
        return NextResponse.json(
          { error: "Current password and new password are required." },
          { status: 400 }
        );
      }

      if (newPassword.length < 6) {
        return NextResponse.json(
          { error: "New password must be at least 6 characters long." },
          { status: 400 }
        );
      }

      const isValid = verifyPassword(currentPassword, user.password);
      if (!isValid) {
        return NextResponse.json(
          { error: "Current password is incorrect." },
          { status: 400 }
        );
      }

      const newHash = hashPassword(newPassword);
      await db.user.update({
        where: { id: user.id },
        data: { password: newHash },
      });

      return NextResponse.json({
        success: true,
        message: "Password updated successfully.",
      });
    }

    // Handle profile details update
    const nextUsername =
      body.username !== undefined ? body.username.trim() : user.username;
    const nextEmail =
      body.email !== undefined ? body.email.trim().toLowerCase() : user.email;
    const nextName =
      body.name !== undefined ? body.name.trim() : user.name || user.username;

    if (!nextUsername || nextUsername.length < 3) {
      return NextResponse.json(
        { error: "Username must be at least 3 characters long." },
        { status: 400 }
      );
    }

    if (!/^[a-zA-Z0-9_.-]+$/.test(nextUsername)) {
      return NextResponse.json(
        {
          error:
            "Username may only contain letters, numbers, underscores, dots, and hyphens.",
        },
        { status: 400 }
      );
    }

    if (!nextEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(nextEmail)) {
      return NextResponse.json(
        { error: "Please enter a valid email address." },
        { status: 400 }
      );
    }

    if (nextUsername.toLowerCase() !== user.username.toLowerCase()) {
      const existingUsername = await db.user.findFirst({
        where: {
          username: { equals: nextUsername, mode: "insensitive" },
          NOT: { id: user.id },
        },
      });
      if (existingUsername) {
        return NextResponse.json(
          { error: "This username is already taken." },
          { status: 409 }
        );
      }
    }

    if (nextEmail !== user.email.toLowerCase()) {
      const existingEmail = await db.user.findFirst({
        where: {
          email: nextEmail,
          NOT: { id: user.id },
        },
      });
      if (existingEmail) {
        return NextResponse.json(
          { error: "This email is already in use by another account." },
          { status: 409 }
        );
      }
    }

    const updatedUser = await db.user.update({
      where: { id: user.id },
      data: {
        username: nextUsername,
        email: nextEmail,
        name: nextName || nextUsername,
      },
    });

    await setSessionCookie({
      id: updatedUser.id,
      username: updatedUser.username,
      email: updatedUser.email,
    });

    return NextResponse.json({
      user: {
        id: updatedUser.id,
        username: updatedUser.username,
        email: updatedUser.email,
        name: updatedUser.name || updatedUser.username,
        imageUrl: updatedUser.imageUrl,
      },
    });
  } catch (error) {
    console.error("PATCH /api/auth/me error:", error);
    return NextResponse.json(
      { error: "Failed to update profile" },
      { status: 500 }
    );
  }
}

