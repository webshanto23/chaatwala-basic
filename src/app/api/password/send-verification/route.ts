import { NextResponse } from "next/server";
import { sendEmailVerification } from "@/app/actions/password";

export async function POST() {
  try {
    const result = await sendEmailVerification();

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ message: result.message }, { status: 200 });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
