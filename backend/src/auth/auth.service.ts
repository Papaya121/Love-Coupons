import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from "@nestjs/common";
import { LoginUserDto } from "./dto/loginUser.dto";
import { RegisterUserDto } from "./dto/registerUser.dto";
import * as argon2 from "argon2";
import { CreateUserDto } from "src/users/dto/createUser.dto";
import { UsersService } from "src/users/users.service";
import { UserDto } from "src/users/dto/user.dto";
import { AuthResponseDto } from "./dto/authResponse.dto";
import { User } from "src/users/user.entity";
import { JwtService } from "@nestjs/jwt";

@Injectable()
export class AuthService {
  public constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async register(dto: RegisterUserDto): Promise<AuthResponseDto> {
    const hashedPassword = await argon2.hash(dto.password);
    const createUserDto: CreateUserDto = {
      email: dto.email,
      login: dto.login,
      name: dto.name,
      hashedPassword,
    };

    const user = await this.usersService.createUser(createUserDto);

    return await this.auth(user);
  }

  async login(dto: LoginUserDto): Promise<AuthResponseDto> {
    const user =
      (await this.usersService.findByLogin(dto.login)) ??
      (await this.usersService.findByEmail(dto.login));

    if (user == null) throw new UnauthorizedException("Invalid credentails!");

    if ((await argon2.verify(user.hashedPassword, dto.password)) == false)
      throw new UnauthorizedException("Invalid credentails!");

    return await this.auth(user);
  }

  async auth(user: User): Promise<AuthResponseDto> {
    const payload = {
      sub: user.id,
      login: user.login,
    };
    const accessToken = await this.jwtService.signAsync(payload);

    const userDto: UserDto = {
      id: user.id,
      email: user.email,
      login: user.login,
      name: user.name,
      createdAt: user.createdAt,
    };

    const responseDto: AuthResponseDto = {
      user: userDto,
      accessToken,
    };

    return responseDto;
  }
}
