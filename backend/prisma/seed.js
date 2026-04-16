"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function main() {
    const passwordHash = await bcryptjs_1.default.hash("Admin1234!", 12);
    await prisma.user.upsert({
        where: { email: "admin@example.com" },
        update: {},
        create: {
            email: "admin@example.com",
            passwordHash,
            role: client_1.Role.admin,
        },
    });
    const customers = await Promise.all(Array.from({ length: 30 }).map((_, i) => prisma.customer.create({
        data: {
            externalId: `CUST-${1000 + i}`,
            name: `Customer ${i + 1}`,
            email: `customer${i + 1}@example.com`,
            country: i % 2 === 0 ? "US" : "IN",
            lifecycleStage: i % 3 === 0 ? "enterprise" : "growth",
        },
    })));
    for (const customer of customers) {
        await prisma.order.createMany({
            data: [
                {
                    customerId: customer.id,
                    amount: (Math.random() * 500 + 100).toFixed(2),
                    status: "paid",
                    orderedAt: new Date(),
                },
                {
                    customerId: customer.id,
                    amount: (Math.random() * 250 + 50).toFixed(2),
                    status: "paid",
                    orderedAt: new Date(),
                },
            ],
        });
        await prisma.event.createMany({
            data: [
                {
                    customerId: customer.id,
                    eventType: "dashboard_view",
                    occurredAt: new Date(),
                    metadata: { source: "seed" },
                },
                {
                    customerId: customer.id,
                    eventType: "report_export",
                    occurredAt: new Date(),
                    metadata: { source: "seed" },
                },
            ],
        });
    }
}
main()
    .then(async () => {
    await prisma.$disconnect();
})
    .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
});
//# sourceMappingURL=seed.js.map