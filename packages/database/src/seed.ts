import * as dotenv from "dotenv";
import { eq } from "drizzle-orm";
import { items, users } from "./db/schema";
import { db } from "./index";

// Load environment variables
dotenv.config();

async function seed() {
  try {
    console.log("🌱 Starting database seeding...");

    // Clear existing data
    console.log("🗑️  Clearing existing data...");
    await db.delete(items);
    await db.delete(users);

    // Create a test user
    console.log("👤 Creating test user...");
    const [testUser] = await db
      .insert(users)
      .values({
        clerkUserId: "test_user_123",
        email: "test@example.com",
        name: "Test User",
        storageUsed: 0,
        storageLimit: 16106127360, // 15GB
      })
      .returning();

    console.log(`✅ Created test user: ${testUser.id}`);

    // Create sample folders and files
    console.log("📁 Creating sample folders and files...");

    await db.insert(items).values({
      userId: testUser.id,
      parentId: null,
      name: "Old Projects",
      type: "folder",
      sizeBytes: 0,
    });

    await db.insert(items).values({
      userId: testUser.id,
      parentId: null,
      name: "Random Docs",
      type: "file",
      fileType: "TXT",
      sizeBytes: 45000,
      mimeType: "text/plain",
    });

    const [maybeLaterFolder] = await db
      .insert(items)
      .values({
        userId: testUser.id,
        parentId: null,
        name: "Maybe Later",
        type: "folder",
        sizeBytes: 0,
      })
      .returning();

    // Create files inside Maybe Later folder
    await db.insert(items).values([
      {
        userId: testUser.id,
        parentId: maybeLaterFolder.id,
        name: "old_resume.pdf",
        type: "file",
        fileType: "PDF",
        sizeBytes: 2100000,
        mimeType: "application/pdf",
      },
      {
        userId: testUser.id,
        parentId: maybeLaterFolder.id,
        name: "random_notes.txt",
        type: "file",
        fileType: "TXT",
        sizeBytes: 45000,
        mimeType: "text/plain",
      },
      {
        userId: testUser.id,
        parentId: maybeLaterFolder.id,
        name: "maybe_useful.zip",
        type: "file",
        fileType: "ZIP",
        sizeBytes: 156000000,
        mimeType: "application/zip",
      },
      {
        userId: testUser.id,
        parentId: maybeLaterFolder.id,
        name: "forgotten_photos",
        type: "folder",
        sizeBytes: 0,
      },
      {
        userId: testUser.id,
        parentId: maybeLaterFolder.id,
        name: "old_presentations.pptx",
        type: "file",
        fileType: "PPTX",
        sizeBytes: 89000000,
        mimeType:
          "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      },
      {
        userId: testUser.id,
        parentId: maybeLaterFolder.id,
        name: "Unused Assets",
        type: "folder",
        sizeBytes: 0,
      },
      {
        userId: testUser.id,
        parentId: maybeLaterFolder.id,
        name: "Temp Downloads",
        type: "folder",
        sizeBytes: 0,
      },
    ]);

    // Update user's storage used
    const totalStorage = 2100000 + 45000 + 156000000 + 89000000 + 45000; // Sum of file sizes
    await db
      .update(users)
      .set({ storageUsed: totalStorage })
      .where(eq(users.id, testUser.id));

    console.log("✅ Created sample folders and files");
    console.log(
      `📊 Total storage used: ${(totalStorage / 1024 / 1024).toFixed(2)} MB`
    );
    console.log("🎉 Database seeding completed successfully!");
  } catch (error) {
    console.error("❌ Error seeding database:", error);
    process.exit(1);
  }
}

// Run the seed function
if (require.main === module) {
  seed()
    .then(() => {
      console.log("🏁 Seeding process finished.");
      process.exit(0);
    })
    .catch((error) => {
      console.error("💥 Seeding process failed:", error);
      process.exit(1);
    });
}

export { seed };
