import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { z } from "zod";

const Schema = z.object({
  name:    z.string().min(2, "Name required"),
  phone:   z.string().min(7, "Valid phone number required"),
  message: z.string().min(5, "Message required").max(500),
  email:   z.string().email().optional().or(z.literal("")),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = Schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation error", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    console.log("🔍 POST /api/landlord-requests received");
    console.log("🔍 Payload:", body);
    console.log("🔍 Supabase URL exists:", !!process.env.NEXT_PUBLIC_SUPABASE_URL);
    console.log("🔍 Service role key exists:", !!process.env.SUPABASE_SERVICE_ROLE_KEY);

    const admin = createAdminClient();

    const { data, error } = await admin
  .from("landlord_requests")
  .insert({
    full_name: parsed.data.name,
    phone: parsed.data.phone,
    email: parsed.data.email || null,
    property_details: parsed.data.message,   // ✅ column name matches table
    status: "PENDING",
    })
  .select()
  .single();

    if (error) {
      console.error("🔍 Supabase ERROR:", JSON.stringify(error, null, 2));
      return NextResponse.json(
        { error: "Database error: " + error.message, details: error },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { message: "Request submitted! We will contact you within 24 hours.", data },
      { status: 201 }
    );
  } catch (err) {
    console.error("🔍 Unexpected error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to submit request" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const admin = createAdminClient();
    const { data, error } = await admin
      .from("landlord_requests")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return NextResponse.json({ data: data ?? [] });
  } catch (err) {
    console.error("🔍 GET error:", err);
    return NextResponse.json({ error: "Failed to fetch requests" }, { status: 500 });
  }
}