import { Module } from "@nestjs/common";
import { CouplesController } from "./couples.controller";
import { CouplesService } from "./couples.service";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Couple } from "./couple.entity";
import { JwtAuthGuard } from "src/auth/jwt-auth.guard";
import { JwtStrategy } from "src/auth/jwt.strategy";
import { UsersModule } from "src/users/users.module";
import { Invite } from "./invite.entity";
import { NotificationsModule } from "src/notifications/notifications.module";

@Module({
  imports: [
    TypeOrmModule.forFeature([Couple, Invite]),
    UsersModule,
    NotificationsModule,
  ],
  controllers: [CouplesController],
  providers: [CouplesService, JwtStrategy],
  exports: [CouplesService],
})
export class CouplesModule {}
