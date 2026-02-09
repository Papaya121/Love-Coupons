import { NotificationType } from "../notification.entity";
import { NotificationPayloadMap } from "./notification.types";

export type CreateNotificationDto<
  T extends NotificationType = NotificationType,
> = {
  userId: string;
  type: T;
  data: NotificationPayloadMap[T];
};
