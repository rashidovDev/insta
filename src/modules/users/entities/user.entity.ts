
import {
  Column,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Post } from '../../posts/entities/post.entity';
import { RefreshSession } from '../../auth/entities/refresh-session.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  name!: string;

  @Column({ unique: true })
  email!: string;

  @Column()
  passwordHash!: string;

  @OneToMany(() => Post, (post) => post.user)
  posts! : Post[];

  @OneToMany(
  () => RefreshSession,
  (refreshSession) => refreshSession.user,
)
refreshSessions!: RefreshSession[];
}