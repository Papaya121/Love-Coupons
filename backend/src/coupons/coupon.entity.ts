import { UserDto } from "src/users/dto/user.dto";
import { User } from "src/users/user.entity";
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
} from "typeorm";

export enum CouponStatus {
  AVAILABLE = "available",
  REDEEMED = "redeemed",
  EXPIRED = "expired",
}

@Entity("coupons")
export class Coupon {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column()
  authorId: string;

  @Column()
  ownerId: string;

  @Column()
  title: string;

  @Column()
  description: string;

  @Column({
    type: "enum",
    enum: CouponStatus,
    default: CouponStatus.AVAILABLE,
  })
  status: CouponStatus;

  @Column({
    type: "timestamptz",
    nullable: true,
  })
  expiresAt: Date | null;

  @Column({
    type: "timestamptz",
    nullable: true,
  })
  redeemedDate: Date | null;

  @CreateDateColumn({ type: "timestamptz" })
  createdAt: Date;

  get computedStatus(): CouponStatus {
    if (this.status === CouponStatus.REDEEMED) return CouponStatus.REDEEMED;
    if (this.status === CouponStatus.EXPIRED) return CouponStatus.EXPIRED;
    if (this.expiresAt && this.expiresAt.getTime() < Date.now())
      return CouponStatus.EXPIRED;
    return CouponStatus.AVAILABLE;
  }
}
