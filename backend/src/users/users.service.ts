import { ConflictException, Injectable } from "@nestjs/common";
import { Repository } from "typeorm";
import { User } from "./user.entity";
import { CreateUserDto } from "./dto/createUser.dto";
import { InjectRepository } from "@nestjs/typeorm";
import { UserDto } from "./dto/user.dto";

@Injectable()
export class UsersService {
  public constructor(
    @InjectRepository(User)
    private readonly users: Repository<User>,
  ) {}

  public async createUser(dto: CreateUserDto): Promise<User> {
    if (await this.users.findOne({ where: { login: dto.login } }))
      throw new ConflictException(
        `User with login \"${dto.login}\" arleady exist!`,
      );

    if (await this.users.findOne({ where: { email: dto.email } }))
      throw new ConflictException(
        `User with email \"${dto.email}\" arleady exist!`,
      );

    const user = await this.users.create(dto);

    return await this.users.save(user);
  }

  public async findByLogin(login: string): Promise<User | null> {
    if (!login) return null;
    return await this.users.findOne({ where: { login } });
  }

  public async findByEmail(email: string): Promise<User | null> {
    if (!email) return null;
    return await this.users.findOne({ where: { email } });
  }

  public async findByUUID(uuid: string): Promise<User | null> {
    if (!uuid) return null;
    return await this.users.findOne({ where: { id: uuid } });
  }

  public async getAllUsers(): Promise<UserDto[]> {
    const users = await this.users.find();
    return users.map((u) => new UserDto(u));
  }
}
