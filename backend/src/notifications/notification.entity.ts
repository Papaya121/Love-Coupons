import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from "typeorm";

export enum NotificationType {
  COUPON = "coupon",
  INVITE = "invite",
  REDEEM = "redeem",
  SYSTEM = "system",
}

export enum NotificationStatus {
  NEW = "new",
  SEEN = "seen",
  ARCHIVED = "archived",
}

@Entity("users")
export class User {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column()
  user_id: string;

  @Column({
    type: "enum",
    enum: NotificationType,
    default: NotificationType.COUPON,
  })
  type: NotificationType;

  @Column()
  title: string;

  @Column()
  text: string;

  @Column({
    type: "enum",
    enum: NotificationStatus,
    default: NotificationStatus.NEW,
  })
  status: string;

  @Column({ type: "jsonb", nullable: true })
  data: {
    coupon_id?: string;
  };

  @CreateDateColumn()
  createdAt: Date;

  @Column({ type: "timestamp" })
  readAt: Date;
}
