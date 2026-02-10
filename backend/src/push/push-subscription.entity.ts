import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
} from "typeorm";

@Entity("push_subscriptions")
export class PushSubscription {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: "text", unique: true })
  endpoint: string;

  @Column({ type: "text" })
  p256dh: string;

  @Column({ type: "text" })
  auth: string;

  @Column()
  userId: string;

  @CreateDateColumn({ type: "timestamptz" })
  createdAt: Date;
}
