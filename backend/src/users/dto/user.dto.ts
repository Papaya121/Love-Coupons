import { User } from "../user.entity";

export class UserDto {
  id: string;
  email: string;
  login: string;
  name: string;
  createdAt: Date;

  constructor(user: User) {
    this.id = user.id;
    this.email = user.email;
    this.login = user.login;
    this.name = user.name;
    this.createdAt = user.createdAt;
  }
}
