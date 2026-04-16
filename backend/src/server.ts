import { env } from "./config/env";
import { prisma } from "./db/prisma";
import { app } from "./app";

async function bootstrap() {
  await prisma.$connect();
  app.listen(env.PORT, () => {
    console.log(`API running on port ${env.PORT}`);
  });
}

bootstrap().catch(async (error) => {
  console.error(error);
  await prisma.$disconnect();
  process.exit(1);
});
