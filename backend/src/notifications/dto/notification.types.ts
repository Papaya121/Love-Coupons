import { NotificationType } from "../notification.entity";

export type NotificationPayloadMap = {
  [NotificationType.COUPON]: { couponId: string };
  [NotificationType.INVITE]: { inviteId: string };
  [NotificationType.REDEEM]: { redeemId: string };
  [NotificationType.SYSTEM]: null;
};

export type NotificationData = NotificationPayloadMap[NotificationType];
