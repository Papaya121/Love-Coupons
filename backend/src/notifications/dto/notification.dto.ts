import { NotificationType, NotificationStatus } from "../notification.entity";
import type { NotificationData } from "./notification.types";
import { Notification } from "../notification.entity";

export class NotificationDto {
  id: string;
  type: NotificationType;
  status: NotificationStatus;
  data: NotificationData;
  createdAt: Date;
  readAt: Date | null;

  constructor(notification: Notification) {
    this.id = notification.id;
    this.type = notification.type;
    this.status = notification.status;
    this.data = notification.data;
    this.createdAt = notification.createdAt;
    this.readAt = notification.readAt;
  }
}
