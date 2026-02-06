export class CreateCouponDto {
  authorId: string;
  ownerId: string;
  title: string;
  description: string;
  expiresInDays: number | null;
}
