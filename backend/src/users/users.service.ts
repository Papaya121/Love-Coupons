import {
  BadRequestException,
  ConflictException,
  Injectable,
} from "@nestjs/common";
import { Repository } from "typeorm";
import { User } from "./user.entity";
import { CreateUserDto } from "./dto/createUser.dto";
import { InjectRepository } from "@nestjs/typeorm";
import { UserDto } from "./dto/user.dto";

const LOGIN_PATTERN = /^[a-z0-9._-]+$/;

@Injectable()
export class UsersService {
  public constructor(
    @InjectRepository(User)
    private readonly users: Repository<User>,
  ) {}

  private normalizeLogin(login: string): string {
    return (login ?? "").trim().toLowerCase();
  }

  private assertValidLogin(login: string): void {
    if (!login)
      throw new BadRequestException("Логин обязателен.");

    if (!LOGIN_PATTERN.test(login))
      throw new BadRequestException(
        "Логин может содержать только латинские буквы, цифры и символы . _ -",
      );
  }

  public async createUser(dto: CreateUserDto): Promise<User> {
    const normalizedLogin = this.normalizeLogin(dto.login);
    this.assertValidLogin(normalizedLogin);
    const normalizedEmail = (dto.email ?? "").trim().toLowerCase();

    if (await this.findByLogin(normalizedLogin))
      throw new ConflictException("Логин уже занят.");

    if (await this.findByEmail(normalizedEmail))
      throw new ConflictException("Почта уже используется.");

    const user = await this.users.create({
      ...dto,
      login: normalizedLogin,
      email: normalizedEmail,
    });

    return await this.users.save(user);
  }

  public async findByLogin(login: string): Promise<User | null> {
    const normalizedLogin = this.normalizeLogin(login);
    if (!normalizedLogin) return null;
    return await this.users
      .createQueryBuilder("user")
      .where("LOWER(user.login) = LOWER(:login)", { login: normalizedLogin })
      .getOne();
  }

  public async findByEmail(email: string): Promise<User | null> {
    const normalizedEmail = (email ?? "").trim().toLowerCase();
    if (!normalizedEmail) return null;
    return await this.users
      .createQueryBuilder("user")
      .where("LOWER(user.email) = LOWER(:email)", { email: normalizedEmail })
      .getOne();
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
