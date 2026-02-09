import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from "typeorm";
import type { NotificationData } from "./dto/notification.types";

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

@Entity("notifications")
export class Notification {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column()
  userId: string;

  @Column({
    type: "enum",
    enum: NotificationType,
    default: NotificationType.COUPON,
  })
  type: NotificationType;

  @Column({
    type: "enum",
    enum: NotificationStatus,
    default: NotificationStatus.NEW,
  })
  status: NotificationStatus;

  @Column({ type: "jsonb", nullable: true })
  data: NotificationData;

  @CreateDateColumn({ type: "timestamptz" })
  createdAt: Date;

  @Column({ type: "timestamptz", nullable: true })
  readAt: Date | null;
}
