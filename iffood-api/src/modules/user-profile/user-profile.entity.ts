import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { StoreUser } from '../store/store-user/store-user.entity';

@Entity({
  name: 'user_profiles',
})
export class UserProfile {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column()
  email: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at', nullable: true })
  deletedAt?: Date;

  @Column({ name: 'user_auth_id' })
  userAuthId: string;

  @OneToMany(() => StoreUser, (storeUser) => storeUser.userProfile, {
    cascade: true,
  })
  storeUsers: StoreUser[];
}
