import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Post,
  UnauthorizedException,
  UseGuards,
} from "@nestjs/common";
import { CouplesService } from "./couples.service";
import { JwtAuthGuard } from "src/auth/jwt-auth.guard";
import { CurrentUser } from "src/auth/currentUser.decorator";
import { UserDto } from "src/users/dto/user.dto";
import type { JwtPayload } from "src/auth/jwt.strategy";
import { UsersService } from "src/users/users.service";
import { CoupleDto } from "./dto/couple.dto";
import { PairCoupleIdDto } from "./dto/pairCoupleId.dto";
import { InviteDto } from "./dto/invite.dto";

@Controller("couples")
@UseGuards(JwtAuthGuard)
export class CouplesController {
  public constructor(
    private readonly couplesService: CouplesService,
    private readonly usersService: UsersService,
  ) {}

  @Get()
  async getCouple(@CurrentUser() req: JwtPayload): Promise<CoupleDto> {
    const user = await this.usersService.findByUUID(req.sub);
    if (user == null) throw new UnauthorizedException();
    const couple = await this.couplesService.getCouple(user.id);
    if (couple == null) throw new NotFoundException("Couple is not found!");

    console.log(couple);

    const dto: CoupleDto = {
      id: couple.id,
      firstUserId: couple.firstUserId,
      secondUserId: couple.secondUserId,
      createdAt: couple.createdAt,
    };
    return dto;
  }

  @Post("invite/send/:uuid")
  async inviteSend(
    @CurrentUser() req: JwtPayload,
    @Param("uuid") uuid: string,
  ): Promise<InviteDto> {
    const user = await this.usersService.findByUUID(req.sub);
    if (user == null) throw new UnauthorizedException();

    const coupleUser = await this.usersService.findByUUID(uuid);
    if (coupleUser == null)
      throw new NotFoundException("Couple User is not found!");

    const invite = await this.couplesService.inviteCouple({
      firstUserId: user.id,
      secondUserId: coupleUser.id,
    });

    return new InviteDto(invite);
  }

  @Post("invite/accept/:uuid")
  async acceptInvite(
    @CurrentUser() req: JwtPayload,
    @Param("uuid") uuid: string,
  ): Promise<CoupleDto> {
    const user = await this.usersService.findByUUID(req.sub);
    if (user == null) throw new UnauthorizedException();

    const couple = await this.couplesService.acceptInviteCouple(uuid, user.id);

    const dto: CoupleDto = {
      id: couple.id,
      firstUserId: couple.firstUserId,
      secondUserId: couple.secondUserId,
      createdAt: couple.createdAt,
    };

    return dto;
  }

  @Get("invite/sended")
  async getSendedInvites(@CurrentUser() req: JwtPayload): Promise<InviteDto[]> {
    const user = await this.usersService.findByUUID(req.sub);
    if (user == null) throw new UnauthorizedException();

    const invites = await this.couplesService.getAllSendedInvites(user.id);
    return invites.map((u) => new InviteDto(u));
  }

  @Get("invite/recieved")
  async getRecievedInvites(
    @CurrentUser() req: JwtPayload,
  ): Promise<InviteDto[]> {
    const user = await this.usersService.findByUUID(req.sub);
    if (user == null) throw new UnauthorizedException();

    const invites = await this.couplesService.getAllRecievedInvites(user.id);
    return invites.map((u) => new InviteDto(u));
  }

  @Post("unpair")
  async unpairCouple(
    @CurrentUser() req: JwtPayload,
    @Body() body: PairCoupleIdDto,
  ) {
    const user = await this.usersService.findByUUID(req.sub);
    if (user == null) throw new UnauthorizedException();

    await this.couplesService.unpairCouple(user.id);
  }
}
