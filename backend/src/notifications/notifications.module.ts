import { Module } from "@nestjs/common";
import { NotificationsService } from "./notifications.service";
import { NotificationsController } from "./notifications.controller";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Notification } from "./notification.entity";
import { UsersModule } from "src/users/users.module";
import { JwtStrategy } from "src/auth/jwt.strategy";

@Module({
  imports: [TypeOrmModule.forFeature([Notification]), UsersModule],
  providers: [NotificationsService, JwtStrategy],
  controllers: [NotificationsController],
  exports: [NotificationsService],
})
export class NotificationsModule {}
