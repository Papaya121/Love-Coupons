import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Coupon, CouponStatus } from "./coupon.entity";
import { Repository } from "typeorm";
import { CreateCouponDto } from "./dto/createCoupon.dto";
import { UsersService } from "src/users/users.service";
import { CouplesService } from "src/couples/couples.service";
import { NotificationsService } from "src/notifications/notifications.service";
import { NotificationType } from "src/notifications/notification.entity";

@Injectable()
export class CouponsService {
  public constructor(
    @InjectRepository(Coupon)
    private readonly coupons: Repository<Coupon>,
    private readonly usersService: UsersService,
    private readonly couplesService: CouplesService,
    private readonly notificationsServce: NotificationsService,
  ) {}

  public async createCoupon(dto: CreateCouponDto): Promise<Coupon> {
    const author = await this.usersService.findByUUID(dto.authorId);
    const user = await this.usersService.findByUUID(dto.ownerId);
    if (user == null) throw new NotFoundException("User not found!");
    if (author == null) throw new UnauthorizedException();

    const couple = await this.couplesService.getCouple(author.id);
    if (
      couple == null ||
      (couple.firstUserId != dto.ownerId && couple.secondUserId != dto.ownerId)
    )
      throw new BadRequestException("User is not couple with you!");

    const coupon = await this.coupons.create(dto);

    if (dto.expiresInDays != null && dto.expiresInDays > 0) {
      const expiresAt = new Date();
      expiresAt.setUTCDate(expiresAt.getUTCDate() + dto.expiresInDays);
      coupon.expiresAt = expiresAt;
    } else {
      coupon.expiresAt = null;
    }

    const savedCoupon = await this.coupons.save(coupon);

    await this.notificationsServce.createNotification({
      userId: user.id,
      type: NotificationType.COUPON,
      data: { couponId: savedCoupon.id },
    });

    return savedCoupon;
  }

  public async redeemCoupon(uuid: string) {
    const coupon = await this.getCouponByUUID(uuid);

    if (!coupon) throw new NotFoundException("Coupon not found!");

    const status = coupon.computedStatus;
    if (status == CouponStatus.REDEEMED)
      throw new BadRequestException("Coupon arleady redeemed!");
    else if (status == CouponStatus.EXPIRED)
      throw new BadRequestException("Coupon arleady expired!");

    coupon.status = CouponStatus.REDEEMED;
    coupon.redeemedDate = new Date();

    // coupon.expiresAt?.setDate(coupon.expiresAt.getDate() + 7);

    const savedCoupon = await this.coupons.save(coupon);

    await this.notificationsServce.createNotification({
      userId: savedCoupon.authorId,
      type: NotificationType.REDEEM,
      data: { redeemId: savedCoupon.id },
    });
  }

  public async getCouponsByAuthorUUID(uuid: string): Promise<Coupon[]> {
    const user = await this.usersService.findByUUID(uuid);
    if (user == null) throw new NotFoundException("User not found!");

    const coupons = await this.coupons.find({ where: { authorId: uuid } });

    return coupons;
  }

  public async getCouponsByOwnerUUID(uuid: string): Promise<Coupon[]> {
    const user = await this.usersService.findByUUID(uuid);
    if (user == null) throw new NotFoundException("User not found!");

    const coupons = await this.coupons.find({ where: { ownerId: uuid } });

    return coupons;
  }

  public async getCouponByUUID(uuid: string): Promise<Coupon | null> {
    return await this.coupons.findOne({ where: { id: uuid } });
  }
}
