import { createParamDecorator, ExecutionContext } from "@nestjs/common";

export type CurrentUserType = { sub: string; login: string };

export const CurrentUser = createParamDecorator(
  (_: unknown, ctx: ExecutionContext) => {
    const req = ctx.switchToHttp().getRequest();
    return req.user as CurrentUserType;
  },
);
