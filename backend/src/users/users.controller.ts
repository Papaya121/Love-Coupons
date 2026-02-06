import { Controller, Get, Param } from "@nestjs/common";
import { UsersService } from "./users.service";

@Controller("users")
export class UsersController {
  public constructor(private readonly usersService: UsersService) {}

  @Get()
  async getAllUsers() {
    return await this.usersService.getAllUsers();
  }
  @Get(":uuid")
  async getUser(@Param("uuid") uuid: string) {
    return await this.usersService.findByUUID(uuid);
  }
}
