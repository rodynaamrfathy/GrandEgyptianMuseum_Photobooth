import { NextRequest, NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error("DATABASE_URL is not defined in .env.local");

const sql = neon(databaseUrl);

interface RequestBody {
  email: string;
  image_name: string;
  card_name: string;
  kiosk_name?: string;
  filter_name?: string;
}

export async function POST(req: NextRequest) {
  try {
    const { email, image_name, card_name, filter_name, kiosk_name } =
      (await req.json()) as RequestBody;

    if (!email || !image_name || !card_name) {
      return NextResponse.json(
        { error: "Email, image name, and card name are required" },
        { status: 400 }
      );
    }

    // 1. Check if email exists
    const existingEmail = await sql`
      SELECT id FROM emails WHERE email = ${email}
    `;

    let emailId: string;

    if (existingEmail.length > 0) {
      emailId = existingEmail[0].id;
    } else {
      // 2. Insert new email with UUID
      const newEmail = await sql`
        INSERT INTO emails (email)
        VALUES (${email})
        RETURNING id
      `;
      emailId = newEmail[0].id;
    }

    // 3. Insert image record with UUID
    const imageRecord = await sql`
      INSERT INTO image_records (email_id, image_name, card_name, filter_name, kiosk_name)
      VALUES (${emailId}, ${image_name}, ${card_name}, ${filter_name}, ${kiosk_name})
      RETURNING id
    `;

    console.log("Saved image record:", imageRecord);

    return NextResponse.json({ success: true, id: imageRecord[0]?.id });
  } catch (err) {
    console.error("Error saving email/image:", err);
    return NextResponse.json(
      { error: "Failed to save email/image" },
      { status: 500 }
    );
  }
}
