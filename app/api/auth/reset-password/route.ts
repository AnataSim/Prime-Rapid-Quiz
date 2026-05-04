import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase-admin";

export async function POST(request: NextRequest) {
  try {
    const { email, newPassword } = await request.json();

    if (!email || !newPassword) {
      return NextResponse.json({ error: "Email and new password are required" }, { status: 400 });
    }

    // 1. Find user by email to get UID
    let user;
    try {
      user = await adminAuth.getUserByEmail(email);
    } catch (e) {
      return NextResponse.json({ error: "User not found with this email." }, { status: 404 });
    }

    // 2. Check Cooldown in Firestore
    const userRef = adminDb.collection("users").doc(user.uid);
    const userDoc = await userRef.get();
    
    if (userDoc.exists) {
      const data = userDoc.data();
      const lastReset = data?.lastPasswordReset?.toDate();
      
      if (lastReset) {
        const now = new Date();
        const diffTime = Math.abs(now.getTime() - lastReset.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays <= 7) {
          const waitDays = 7 - Math.floor(diffTime / (1000 * 60 * 60 * 24));
          return NextResponse.json({ 
            error: `Password reset cooldown active. Please wait ${waitDays} more day(s).` 
          }, { status: 429 });
        }
      }
    }

    // 3. Update Password in Firebase Auth
    await adminAuth.updateUser(user.uid, {
      password: newPassword
    });

    // 4. Update Cooldown in Firestore
    await userRef.set({
      lastPasswordReset: new Date(),
    }, { merge: true });

    return NextResponse.json({ success: true, message: "Password updated successfully!" }, { status: 200 });
  } catch (error: any) {
    console.error("Reset Password API Error:", error);
    return NextResponse.json({ error: error.message || "Failed to reset password" }, { status: 500 });
  }
}
