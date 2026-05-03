import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";

// GET /api/admin/users — Fetch all users
export async function GET(request: NextRequest) {
  try {
    const snapshot = await adminDb.collection("users").get();

    const users = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return NextResponse.json({ users }, { status: 200 });
  } catch (error: any) {
    console.error("Admin GET /users error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch users" },
      { status: 500 }
    );
  }
}

// PATCH /api/admin/users — Update a user
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }

    // Remove undefined fields
    const cleanUpdates = Object.fromEntries(
      Object.entries(updates).filter(([, v]) => v !== undefined && v !== "")
    );

    await adminDb.collection("users").doc(id).update(cleanUpdates);

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: any) {
    console.error("Admin PATCH /users error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update user" },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/users — Delete a user
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }

    // Delete user doc
    await adminDb.collection("users").doc(id).delete();

    // Optionally delete subcollections (quizHistory)
    const quizHistoryRef = adminDb.collection("users").doc(id).collection("quizHistory");
    const quizHistorySnap = await quizHistoryRef.get();
    const deletePromises = quizHistorySnap.docs.map((doc) => doc.ref.delete());
    await Promise.all(deletePromises);

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: any) {
    console.error("Admin DELETE /users error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to delete user" },
      { status: 500 }
    );
  }
}
