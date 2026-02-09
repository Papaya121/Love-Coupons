import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from "typeorm";

@Entity("users")
export class User {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column()
  email: string;

  @Column({ unique: true })
  login: string;

  @Column()
  hashedPassword: string;

  @Column()
  name: string;

  @CreateDateColumn({ type: "timestamptz" })
  createdAt: Date;
}
