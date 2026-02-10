import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { PushSubscription } from "./push-subscription.entity";
import { PushController } from "./push.controller";
import { PushService } from "./push.service";
import { UsersModule } from "src/users/users.module";
import { CouponsModule } from "src/coupons/coupons.module";

@Module({
  imports: [TypeOrmModule.forFeature([PushSubscription])],
  controllers: [PushController],
  providers: [PushService],
  exports: [PushService],
})
export class PushModule {}
