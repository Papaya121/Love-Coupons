import { UserDto } from "src/users/dto/user.dto";
import { User } from "src/users/user.entity";

export class CoupleDto {
  id: string;
  firstUserId: string;
  secondUserId: string;
  createdAt: Date;
}
