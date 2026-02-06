import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import fs from "node:fs";

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    // httpsOptions: {
    //   key: fs.readFileSync("/Users/papaya/192.168.0.240-key.pem"),
    //   cert: fs.readFileSync("/Users/papaya/192.168.0.240.pem"),
    // },
  });
  app.enableCors();
  await app.listen(process.env.PORT ?? 3120);
}
bootstrap();
