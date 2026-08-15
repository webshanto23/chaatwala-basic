import { NextResponse } from "next/server";
import { setPassword } from "@/app/actions/password";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const result = await setPassword(formData);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ message: result.message }, { status: 200 });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
