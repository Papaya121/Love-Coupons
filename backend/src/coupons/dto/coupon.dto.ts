import { Coupon, CouponStatus } from "../coupon.entity";

export class CouponDto {
  id: string;
  authorId: string;
  ownerId: string;
  title: string;
  description: string;
  status: CouponStatus;
  expiresAt: Date | null;
  createdAt: Date;

  public constructor(coupon: Coupon) {
    this.id = coupon.id;
    this.authorId = coupon.authorId;
    this.ownerId = coupon.ownerId;
    this.title = coupon.title;
    this.description = coupon.description;
    this.status = coupon.computedStatus;
    this.expiresAt = coupon.expiresAt;
    this.createdAt = coupon.createdAt;
  }
}
