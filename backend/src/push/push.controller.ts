import { Body, Controller, Delete, Get, Post, UseGuards } from "@nestjs/common";
import { PushService } from "./push.service";
import { SubscribePushDto } from "./dto/subscribePush.dto";
import { JwtAuthGuard } from "src/auth/jwt-auth.guard";
import { CurrentUser } from "src/auth/currentUser.decorator";
import type { JwtPayload } from "src/auth/jwt.strategy";

@Controller("push")
export class PushController {
  constructor(private readonly pushService: PushService) {}

  @Get("vapid-public-key")
  getVapidPublicKey() {
    return this.pushService.getPublicKey();
  }

  @UseGuards(JwtAuthGuard)
  @Post("subscribe")
  async subscribe(
    @CurrentUser() req: JwtPayload,
    @Body() dto: SubscribePushDto,
  ) {
    const userId = req.sub;
    return this.pushService.subscribe(userId, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Delete("unsubscribe")
  async unsubscribe(
    @CurrentUser() req: JwtPayload,
    @Body() body: { endpoint: string },
  ) {
    const userId = req.sub;
    return this.pushService.unsubscribe(userId, body.endpoint);
  }

  @UseGuards(JwtAuthGuard)
  @Post("test")
  async test(@CurrentUser() req: JwtPayload) {
    const userId = req.sub;
    return this.pushService.sendToUser(userId, {
      title: "Тест",
      body: "Push работает ✅",
      url: "/",
    });
  }
}
