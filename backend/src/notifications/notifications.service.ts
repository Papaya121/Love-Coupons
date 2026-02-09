import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import {
  NotificationType,
  Notification,
  NotificationStatus,
} from "./notification.entity";
import { Repository } from "typeorm";
import { InjectRepository } from "@nestjs/typeorm";
import { UsersService } from "src/users/users.service";
import { CreateNotificationDto } from "./dto/createNotification.dto";

@Injectable()
export class NotificationsService {
  public constructor(
    @InjectRepository(Notification)
    private readonly notifications: Repository<Notification>,
    private readonly usersService: UsersService,
  ) {}

  public async createNotification<T extends NotificationType>(
    dto: CreateNotificationDto<T>,
  ): Promise<Notification> {
    return this.notifications.save({
      userId: dto.userId,
      type: dto.type,
      data: dto.data,
    });
  }

  async getNotifications(userId: string): Promise<Notification[]> {
    const user = await this.usersService.findByUUID(userId);

    if (!user) throw new NotFoundException("User not found!");

    const userNotifications = await this.notifications.find({
      where: { userId },
    });

    return userNotifications;
  }

  async getNotification(notificationId: string): Promise<Notification> {
    const notification = await this.notifications.findOne({
      where: { id: notificationId },
    });

    if (!notification) throw new NotFoundException("Notification not found!");

    return notification;
  }

  async changeNotificationStatus(
    notificationId: string,
    status: NotificationStatus,
  ): Promise<Notification> {
    const notification = await this.getNotification(notificationId);

    if (notification.status == status)
      throw new BadRequestException(
        `Notification status is arleady ${status}!`,
      );

    notification.status = status;

    return await this.notifications.save(notification);
  }
}
