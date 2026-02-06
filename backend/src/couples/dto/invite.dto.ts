import { Invite, InviteStatus } from "../invite.entity";

export class InviteDto {
  id: string;
  senderId: string;
  recieverId: string;
  status: InviteStatus;
  createdAt: Date;

  public constructor(invite: Invite) {
    this.id = invite.id;
    this.senderId = invite.senderId;
    this.recieverId = invite.recieverId;
    this.status = invite.status;
    this.createdAt = invite.createdAt;
  }
}
