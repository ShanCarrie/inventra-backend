import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";

const prisma = new PrismaClient();
const dataDirectory = path.join(__dirname, "seedData");

// Define insert order based on dependencies (parent first)
const orderedModelNames: string[] = [
  "users",
  "products",
  "expenseSummary",
  "expenseByCategory",
  "expenses",
  "salesSummary",
  "sales",
  "purchaseSummary",
  "purchases",
];

// Map of model to unique key (used in `where` for upsert)
const uniqueKeys: Record<string, string> = {
  users: "userId",
  products: "productId",
  purchases: "purchaseId",
  sales: "saleId",
  purchaseSummary: "purchaseSummaryId",
  salesSummary: "salesSummaryId",
  expenses: "expenseId",
  expenseSummary: "expenseSummaryId",
  expenseByCategory: "expenseByCategoryId",
};

async function readSeedData(modelName: string) {
  const filePath = path.join(dataDirectory, `${modelName}.json`);
  if (!fs.existsSync(filePath)) return [];
  return JSON.parse(fs.readFileSync(filePath, "utf-8"));
}

async function main() {
  for (const modelName of orderedModelNames) {
    const model: any = prisma[modelName as keyof typeof prisma];
    const uniqueKey = uniqueKeys[modelName];
    const data = await readSeedData(modelName);

    if (!model || !uniqueKey) {
      console.warn(`⚠️ Skipping unknown model: ${modelName}`);
      continue;
    }

    console.log(`🌱 Seeding ${modelName} (${data.length} records)`);

    for (const item of data) {
      // Foreign key existence check for purchases
      if (modelName === "purchases" && item.productId) {
        const productExists = await prisma.products.findUnique({
          where: { productId: item.productId },
        });
        if (!productExists) {
          console.warn(
            `⚠️ Skipping purchase: productId ${item.productId} not found`
          );
          continue;
        }
      }

      const keyValue = item[uniqueKey];
      if (!keyValue) {
        console.warn(
          `⚠️ Skipping ${modelName} record — missing unique key: ${uniqueKey}`
        );
        continue;
      }

      try {
        await model.upsert({
          where: { [uniqueKey]: keyValue },
          update: item,
          create: item,
        });
      } catch (err: any) {
        console.error(`❌ Error seeding ${modelName}:`, err.message || err);
      }
    }

    console.log(`✅ Finished seeding ${modelName}`);
  }
}

main()
  .catch((err) => {
    console.error("🚨 Seeding failed:", err);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
