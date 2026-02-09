import {
  Controller,
  ForbiddenException,
  Get,
  Param,
  Post,
  UseGuards,
} from "@nestjs/common";
import { NotificationsService } from "./notifications.service";
import { JwtAuthGuard } from "src/auth/jwt-auth.guard";
import { CurrentUser } from "src/auth/currentUser.decorator";
import type { JwtPayload } from "src/auth/jwt.strategy";
import { NotificationDto } from "./dto/notification.dto";
import { NotificationStatus } from "./notification.entity";

@Controller("notifications")
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  public constructor(
    private readonly notificationsService: NotificationsService,
  ) {}

  @Post("see/:uuid")
  async setSeenNotification(
    @Param("uuid") uuid: string,
    @CurrentUser() req: JwtPayload,
  ) {
    const notification = await this.notificationsService.getNotification(uuid);
    if (notification.userId != req.sub) throw new ForbiddenException();

    const response = await this.notificationsService.changeNotificationStatus(
      uuid,
      NotificationStatus.SEEN,
    );

    return new NotificationDto(response);
  }
  @Post("archive/:uuid")
  async setArchivedNotification(
    @Param("uuid") uuid: string,
    @CurrentUser() req: JwtPayload,
  ) {
    const notification = await this.notificationsService.getNotification(uuid);
    if (notification.userId != req.sub) throw new ForbiddenException();

    const response = await this.notificationsService.changeNotificationStatus(
      uuid,
      NotificationStatus.ARCHIVED,
    );

    return new NotificationDto(response);
  }
  @Get()
  async getNotificatios(@CurrentUser() req: JwtPayload) {
    const notifications = await this.notificationsService.getNotifications(
      req.sub,
    );
    return notifications.map((u) => new NotificationDto(u));
  }

  @Get(":uuid")
  async getNotification(
    @Param("uuid") uuid: string,
    @CurrentUser() req: JwtPayload,
  ) {
    const notification = await this.notificationsService.getNotification(uuid);
    if (notification.userId != req.sub) throw new ForbiddenException();

    return new NotificationDto(notification);
  }
}
