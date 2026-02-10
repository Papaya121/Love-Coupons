import { Injectable, Logger } from "@nestjs/common";
import * as webpush from "web-push";
import { SubscribePushDto } from "./dto/subscribePush.dto";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { PushSubscription } from "./push-subscription.entity";
import { NotificationDto } from "src/notifications/dto/notification.dto";
import { NotificationType } from "src/notifications/notification.entity";
import { CreatePushDto } from "./dto/createPush.dto";

@Injectable()
export class PushService {
  private readonly logger = new Logger(PushService.name);

  public constructor(
    @InjectRepository(PushSubscription)
    private readonly repo: Repository<PushSubscription>,
  ) {
    const subject = process.env.VAPID_SUBJECT;
    const pub = process.env.VAPID_PUBLIC_KEY;
    const priv = process.env.VAPID_PRIVATE_KEY;

    if (!subject || !pub || !priv) {
      this.logger.warn(
        "VAPID env vars are not set (VAPID_SUBJECT/PUBLIC/PRIVATE)",
      );
    } else {
      webpush.setVapidDetails(subject, pub, priv);
    }
  }

  private toWebPushSubscription(
    row: PushSubscription,
  ): webpush.PushSubscription {
    return {
      endpoint: row.endpoint,
      keys: {
        p256dh: row.p256dh,
        auth: row.auth,
      },
    };
  }

  async send(subscription: webpush.PushSubscription, payload: any) {
    await webpush.sendNotification(subscription, JSON.stringify(payload));
  }

  async subscribe(userId: string, dto: SubscribePushDto) {
    const endpoint = dto.endpoint;
    const p256dh = dto.keys?.p256dh;
    const auth = dto.keys?.auth;

    const exists = await this.repo.findOne({ where: { endpoint } });

    if (exists) {
      exists.userId = userId;
      exists.p256dh = p256dh;
      exists.auth = auth;
      return this.repo.save(exists);
    }

    const created = this.repo.create({
      userId,
      endpoint,
      p256dh,
      auth,
    });

    return this.repo.save(created);
  }

  async unsubscribe(userId: string, endpoint: string) {
    const res = await this.repo.delete({ userId, endpoint });
    return { deleted: res.affected ?? 0 };
  }

  async sendToUser(userId: string, payload: CreatePushDto) {
    const subs = await this.repo.find({ where: { userId } });

    if (!subs.length) return { sent: 0, removed: 0 };

    let sent = 0;
    let removed = 0;

    for (const row of subs) {
      try {
        await this.send(this.toWebPushSubscription(row), payload);
        sent++;
      } catch (err: any) {
        const statusCode = err?.statusCode;
        if (statusCode === 410 || statusCode === 404) {
          await this.repo.delete({ id: row.id });
          removed++;
          continue;
        }
        this.logger.warn(
          `Push send failed: endpoint=${row.endpoint} status=${statusCode ?? "?"}`,
        );
      }
    }

    return { sent, removed };
  }

  async getPublicKey() {
    return { key: process.env.VAPID_PUBLIC_KEY ?? "" };
  }

  async sendNotification(notification: NotificationDto) {
    const push = await this.generatePush(notification);
    return await this.sendToUser(notification.userId, push);
  }

  private async generatePush(
    notification: NotificationDto,
  ): Promise<CreatePushDto> {
    const push = new CreatePushDto();
    switch (notification.type) {
      case NotificationType.COUPON:
        push.title = "Вам пришел новый купон!";
        push.body = "Зайдите и проверьте ;)";
        push.url = "/coupons";
        break;
      case NotificationType.INVITE:
        push.title = "Вас приглашают на привязку!";
        push.body = "Зайдите и проверьте ;)";
        push.url = "/profile";
        break;
      case NotificationType.REDEEM:
        push.title = "СРОЧНО! ВАШ КУПОН ПРИМЕНИЛИ!";
        push.body = "Зайдите и проверьте ;)";
        push.url = "/create";
        break;
      case NotificationType.SYSTEM:
        push.title = "Вас давно не видно | 8==э";
        push.body = "бебебе";
        push.url = "/";
        break;
    }

    return push;
  }
}
