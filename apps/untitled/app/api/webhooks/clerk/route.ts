import { db, users } from "@ketryon/database";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { Webhook } from "svix";

// Clerk webhook event types
interface ClerkUser {
  id: string;
  email_addresses: Array<{
    email_address: string;
    id: string;
  }>;
  first_name: string | null;
  last_name: string | null;
  username: string | null;
  created_at: number;
  updated_at: number;
}

interface ClerkWebhookEvent {
  type: "user.created" | "user.updated" | "user.deleted";
  data: ClerkUser;
}

export async function POST(request: NextRequest) {
  // Get the headers
  const headerPayload = await headers();
  const svix_id = headerPayload.get("svix-id");
  const svix_timestamp = headerPayload.get("svix-timestamp");
  const svix_signature = headerPayload.get("svix-signature");

  // If there are no headers, error out
  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response("Error occurred -- no svix headers", {
      status: 400,
    });
  }

  // Get the body
  const payload = await request.text();

  // Get the Clerk webhook secret from environment variables
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;

  if (!WEBHOOK_SECRET) {
    throw new Error(
      "Please add CLERK_WEBHOOK_SECRET from Clerk Dashboard to .env or .env.local",
    );
  }

  // Create a new Svix instance with your secret.
  const wh = new Webhook(WEBHOOK_SECRET);

  let evt: ClerkWebhookEvent;

  // Verify the payload with the headers
  try {
    evt = wh.verify(payload, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    }) as ClerkWebhookEvent;
  } catch (err) {
    console.error("Error verifying webhook:", err);
    return new Response("Error occurred", {
      status: 400,
    });
  }

  // Handle the webhook
  const eventType = evt.type;
  const userData = evt.data;

  console.log(`Received Clerk webhook: ${eventType} for user ${userData.id}`);

  try {
    switch (eventType) {
      case "user.created":
        await handleUserCreated(userData);
        break;
      case "user.updated":
        await handleUserUpdated(userData);
        break;
      case "user.deleted":
        await handleUserDeleted(userData);
        break;
      default:
        console.log(`Unhandled event type: ${eventType}`);
    }

    return NextResponse.json({ message: "Webhook processed successfully" });
  } catch (error) {
    console.error(`Error processing webhook ${eventType}:`, error);
    return NextResponse.json(
      { error: "Failed to process webhook" },
      { status: 500 },
    );
  }
}

// Handle user creation
async function handleUserCreated(userData: ClerkUser) {
  const primaryEmail = userData.email_addresses.find(
    (email) => email.id === userData.email_addresses[0]?.id,
  )?.email_address;

  const fullName =
    [userData.first_name, userData.last_name].filter(Boolean).join(" ") ||
    userData.username ||
    "User";

  try {
    await db.insert(users).values({
      clerkUserId: userData.id,
      email: primaryEmail || null,
      name: fullName,
      storageUsed: 0,
      storageLimit: 16106127360, // 15GB default
    });

    console.log(`✅ Created user in database: ${userData.id}`);
  } catch (error) {
    console.error(`❌ Failed to create user ${userData.id}:`, error);
    throw error;
  }
}

// Handle user updates
async function handleUserUpdated(userData: ClerkUser) {
  const primaryEmail = userData.email_addresses.find(
    (email) => email.id === userData.email_addresses[0]?.id,
  )?.email_address;

  const fullName =
    [userData.first_name, userData.last_name].filter(Boolean).join(" ") ||
    userData.username ||
    "User";

  try {
    const result = await db
      .update(users)
      .set({
        email: primaryEmail || null,
        name: fullName,
        updatedAt: new Date(),
      })
      .where(eq(users.clerkUserId, userData.id))
      .returning();

    if (result.length === 0) {
      console.warn(
        `⚠️ User ${userData.id} not found for update, creating instead`,
      );
      await handleUserCreated(userData);
    } else {
      console.log(`✅ Updated user in database: ${userData.id}`);
    }
  } catch (error) {
    console.error(`❌ Failed to update user ${userData.id}:`, error);
    throw error;
  }
}

// Handle user deletion
async function handleUserDeleted(userData: ClerkUser) {
  try {
    const result = await db
      .delete(users)
      .where(eq(users.clerkUserId, userData.id))
      .returning();

    if (result.length === 0) {
      console.warn(`⚠️ User ${userData.id} not found for deletion`);
    } else {
      console.log(`✅ Deleted user from database: ${userData.id}`);
      console.log(`🗑️ Cascade deletion will remove ${result[0].name}'s items`);
    }
  } catch (error) {
    console.error(`❌ Failed to delete user ${userData.id}:`, error);
    throw error;
  }
}
