import * as dotenv from "dotenv";
import { knowledgeBaseQuestions } from "./db/schema";
import { db } from "./index";
import { seed } from "./seed";
import { seedBudgetWebsite } from "./seed-budget-website";
import { seedCustomWebApp } from "./seed-custom-web-app";
import { seedHiringDeveloper } from "./seed-hiring-developer";
import { seedMVP } from "./seed-mvp";
import { seedMvpTimeline } from "./seed-mvp-timeline";
import { seedSaasTools } from "./seed-saas-tools";
import { seedWebsiteFeatures } from "./seed-website-features";

// Load environment variables
dotenv.config();

async function seedAll() {
  try {
    console.log("🌱 Starting comprehensive database seeding...");

    // Clear existing data first
    console.log("🗑️  Clearing existing knowledge base questions...");
    await db.delete(knowledgeBaseQuestions);

    // Run main seed (full-stack and website cost questions)
    console.log(
      "📝 Seeding main questions (full-stack development & website costs)..."
    );
    await seed();

    // Run MVP seed
    console.log("📝 Seeding MVP question...");
    await seedMVP();

    // Run budget website seed
    console.log("📝 Seeding budget website question...");
    await seedBudgetWebsite();

    // Run SaaS tools seed
    console.log("📝 Seeding SaaS tools question...");
    await seedSaasTools();

    // Run hiring developer seed
    console.log("📝 Seeding hiring developer question...");
    await seedHiringDeveloper();

    // Run custom web app seed
    console.log("📝 Seeding custom web app question...");
    await seedCustomWebApp();

    // Run MVP timeline seed
    console.log("📝 Seeding MVP timeline question...");
    await seedMvpTimeline();

    // Run website features seed
    console.log("📝 Seeding website features question...");
    await seedWebsiteFeatures();

    console.log("\n🎉 All knowledge base questions seeded successfully!");

    // Get total count
    const totalQuestions = await db.select().from(knowledgeBaseQuestions);
    console.log(`📊 Total questions in database: ${totalQuestions.length}`);

    console.log("\n📋 All seeded questions:");
    totalQuestions.forEach((question, index) => {
      console.log(`${index + 1}. ${question.question} (${question.slug})`);
    });
  } catch (error) {
    console.error("❌ Error seeding all questions:", error);
    process.exit(1);
  }
}

// Run the seed function
if (require.main === module) {
  seedAll()
    .then(() => {
      console.log("🏁 Complete seeding process finished.");
      process.exit(0);
    })
    .catch((error) => {
      console.error("💥 Complete seeding process failed:", error);
      process.exit(1);
    });
}

export { seedAll };
