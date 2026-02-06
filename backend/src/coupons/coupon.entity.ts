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
    type: "timestamp",
    nullable: true,
  })
  expiresAt: Date | null;

  @Column({
    type: "timestamp",
    nullable: true,
  })
  redeemedDate: Date | null;

  @CreateDateColumn()
  createdAt: Date;

  get computedStatus(): CouponStatus {
    if (this.status === CouponStatus.REDEEMED) return CouponStatus.REDEEMED;
    if (this.expiresAt && this.expiresAt.getTime() < Date.now())
      return CouponStatus.EXPIRED;
    return CouponStatus.AVAILABLE;
  }
}
