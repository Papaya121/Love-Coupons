import { User } from "src/users/user.entity";
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
} from "typeorm";

export enum InviteStatus {
  AVAILABLE = "available",
  ACCEPTED = "accepted",
  DECLINED = "declined",
}

@Entity("invites")
export class Invite {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column()
  senderId: string;

  @Column()
  recieverId: string;

  @Column({
    type: "enum",
    enum: InviteStatus,
    default: InviteStatus.AVAILABLE,
  })
  status: InviteStatus;

  @CreateDateColumn()
  createdAt: Date;
}
