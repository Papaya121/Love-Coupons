import { UserDto } from "src/users/dto/user.dto";
import { User } from "src/users/user.entity";
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
} from "typeorm";

@Entity("couples")
export class Couple {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column()
  firstUserId: string;

  @Column()
  secondUserId: string;

  @CreateDateColumn({ type: "timestamptz" })
  createdAt: Date;
}
