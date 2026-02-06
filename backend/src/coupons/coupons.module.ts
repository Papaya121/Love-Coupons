import { Module } from "@nestjs/common";
import { CouponsController } from "./coupons.controller";
import { CouponsService } from "./coupons.service";
import { TypeOrmModule } from "@nestjs/typeorm";
import { JwtStrategy } from "src/auth/jwt.strategy";
import { Coupon } from "./coupon.entity";
import { UsersModule } from "src/users/users.module";
import { CouplesModule } from "src/couples/couples.module";

@Module({
  imports: [TypeOrmModule.forFeature([Coupon]), UsersModule, CouplesModule],
  controllers: [CouponsController],
  providers: [CouponsService, JwtStrategy],
})
export class CouponsModule {}
