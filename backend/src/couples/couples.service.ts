import {
  BadRequestException,
  ConflictException,
  HttpException,
  Injectable,
  NotFoundException,
  NotImplementedException,
  UnauthorizedException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { User } from "src/users/user.entity";
import { Couple } from "./couple.entity";
import { PairCoupleDto } from "./dto/pairCouple.dto";
import { Repository } from "typeorm";
import { Invite, InviteStatus } from "./invite.entity";
import { PairCoupleIdDto } from "./dto/pairCoupleId.dto";

@Injectable()
export class CouplesService {
  public constructor(
    @InjectRepository(Couple)
    private readonly couples: Repository<Couple>,
    @InjectRepository(Invite)
    private readonly invites: Repository<Invite>,
  ) {}

  public async inviteCouple(dto: PairCoupleDto) {
    const existing = await this.invites.findOne({
      where: {
        senderId: dto.firstUserId,
        recieverId: dto.secondUserId,
        status: InviteStatus.AVAILABLE,
      },
    });
    if (existing) throw new ConflictException();

    if (dto.firstUserId == dto.secondUserId) throw new BadRequestException();
    if (
      ((await this.getCouple(dto.firstUserId)) ??
        (await this.getCouple(dto.secondUserId))) != null
    )
      throw new ConflictException("One of users arleady have a couple");

    const invite = await this.invites.create({
      senderId: dto.firstUserId,
      recieverId: dto.secondUserId,
    });

    return await this.invites.save(invite);
  }

  public async getAllSendedInvites(userId: string): Promise<Invite[]> {
    if (!userId) throw new BadRequestException();
    return await this.invites.find({ where: { senderId: userId } });
  }
  public async getAllRecievedInvites(userId: string): Promise<Invite[]> {
    if (!userId) throw new BadRequestException();
    return await this.invites.find({ where: { recieverId: userId } });
  }

  public async acceptInviteCouple(uuid: string, accepter: string) {
    const invite = await this.invites.findOne({ where: { id: uuid } });

    if (invite == null) throw new NotFoundException("Invite not found!");

    const senderId = invite.senderId;
    const recieverId = invite.recieverId;

    if (senderId == recieverId) throw new BadRequestException();
    if (recieverId != accepter) throw new UnauthorizedException();
    if (
      ((await this.getCouple(senderId)) ??
        (await this.getCouple(recieverId))) != null
    )
      throw new ConflictException("One of users arleady have a couple");

    invite.status = InviteStatus.ACCEPTED;

    await this.invites.save(invite);

    const pairCoupleDto: PairCoupleDto = {
      firstUserId: senderId,
      secondUserId: recieverId,
    };
    return await this.pairCouple(pairCoupleDto);
  }

  public async pairCouple(dto: PairCoupleDto): Promise<Couple> {
    if (dto.firstUserId == dto.secondUserId) throw new BadRequestException();
    if (
      ((await this.getCouple(dto.firstUserId)) ??
        (await this.getCouple(dto.secondUserId))) != null
    )
      throw new ConflictException("One of users arleady have a couple");

    const couple = await this.couples.create(dto);
    return await this.couples.save(couple);
  }

  public async unpairCouple(anyUserUUID: string) {
    const couple = await this.getCouple(anyUserUUID);
    if (couple == null) throw new NotFoundException("Couple not found!");

    await this.couples.remove(couple);
  }

  public async getCouple(anyUserUUID: string): Promise<Couple | null> {
    const couple = await this.couples.findOne({
      where: [{ firstUserId: anyUserUUID }, { secondUserId: anyUserUUID }],
    });

    return couple;
  }
}
