import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  NotFoundException,
  Param,
  Post,
  UseGuards,
} from "@nestjs/common";
import type { JwtPayload } from "src/auth/jwt.strategy";
import { CouponsService } from "./coupons.service";
import { CurrentUser } from "src/auth/currentUser.decorator";
import { JwtAuthGuard } from "src/auth/jwt-auth.guard";
import { CreateCouponDto } from "./dto/createCoupon.dto";
import { CouponDto } from "./dto/coupon.dto";

@Controller("coupons")
@UseGuards(JwtAuthGuard)
export class CouponsController {
  public constructor(private readonly couponsService: CouponsService) {}

  @Get("owned")
  async getAllOwnedCoupons(@CurrentUser() req: JwtPayload) {
    return await this.couponsService.getCouponsByOwnerUUID(req.sub);
  }
  @Get("sended")
  async getAllSendedCoupons(@CurrentUser() req: JwtPayload) {
    return await this.couponsService.getCouponsByAuthorUUID(req.sub);
  }

  @Get(":uuid")
  async getCoupon(@CurrentUser() req: JwtPayload, @Param("uuid") uuid: string) {
    const coupon = await this.couponsService.getCouponByUUID(uuid);
    if (!coupon) throw new NotFoundException("Coupon not found!");

    if (coupon.ownerId != req.sub && coupon.authorId != req.sub)
      throw new ForbiddenException();

    return new CouponDto(coupon);
  }

  @Post("create")
  async createCoupon(
    @CurrentUser() req: JwtPayload,
    @Body() body: CreateCouponDto,
  ) {
    body.authorId = req.sub;

    const coupon = await this.couponsService.createCoupon(body);
    return new CouponDto(coupon);
  }
  @Post("redeem/:uuid")
  async redeemCoupon(
    @CurrentUser() req: JwtPayload,
    @Param("uuid") uuid: string,
  ) {
    const coupon = await this.couponsService.getCouponByUUID(uuid);
    if (!coupon) throw new NotFoundException("Coupon not found!");

    if (coupon.ownerId != req.sub) throw new ForbiddenException();

    await this.couponsService.redeemCoupon(uuid);
  }
}
