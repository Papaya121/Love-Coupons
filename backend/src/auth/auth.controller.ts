import { Body, Controller, Post } from "@nestjs/common";
import { RegisterUserDto } from "./dto/registerUser.dto";
import { LoginUserDto } from "./dto/loginUser.dto";
import { AuthService } from "./auth.service";

@Controller("auth")
export class AuthController {
  public constructor(private readonly authService: AuthService) {}

  @Post("login")
  async login(@Body() loginUserDto: LoginUserDto) {
    return this.authService.login(loginUserDto);
  }

  @Post("register")
  async register(@Body() registerUserDto: RegisterUserDto) {
    return this.authService.register(registerUserDto);
  }
}
