"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const prisma = new client_1.PrismaClient();
const dataDirectory = path_1.default.join(__dirname, "seedData");
// Define insert order based on dependencies (parent first)
const orderedModelNames = [
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
const uniqueKeys = {
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
function readSeedData(modelName) {
    return __awaiter(this, void 0, void 0, function* () {
        const filePath = path_1.default.join(dataDirectory, `${modelName}.json`);
        if (!fs_1.default.existsSync(filePath))
            return [];
        return JSON.parse(fs_1.default.readFileSync(filePath, "utf-8"));
    });
}
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        for (const modelName of orderedModelNames) {
            const model = prisma[modelName];
            const uniqueKey = uniqueKeys[modelName];
            const data = yield readSeedData(modelName);
            if (!model || !uniqueKey) {
                console.warn(`⚠️ Skipping unknown model: ${modelName}`);
                continue;
            }
            console.log(`🌱 Seeding ${modelName} (${data.length} records)`);
            for (const item of data) {
                // Foreign key existence check for purchases
                if (modelName === "purchases" && item.productId) {
                    const productExists = yield prisma.products.findUnique({
                        where: { productId: item.productId },
                    });
                    if (!productExists) {
                        console.warn(`⚠️ Skipping purchase: productId ${item.productId} not found`);
                        continue;
                    }
                }
                const keyValue = item[uniqueKey];
                if (!keyValue) {
                    console.warn(`⚠️ Skipping ${modelName} record — missing unique key: ${uniqueKey}`);
                    continue;
                }
                try {
                    yield model.upsert({
                        where: { [uniqueKey]: keyValue },
                        update: item,
                        create: item,
                    });
                }
                catch (err) {
                    console.error(`❌ Error seeding ${modelName}:`, err.message || err);
                }
            }
            console.log(`✅ Finished seeding ${modelName}`);
        }
    });
}
main()
    .catch((err) => {
    console.error("🚨 Seeding failed:", err);
})
    .finally(() => __awaiter(void 0, void 0, void 0, function* () {
    yield prisma.$disconnect();
}));
