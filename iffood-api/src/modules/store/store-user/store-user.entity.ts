import {
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { UserProfile } from '../../user-profile/user-profile.entity';
import { Store } from '../store.entity';

@Entity({
  name: 'store_users',
})
export class StoreUser {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Store, (store) => store.storeUsers)
  @JoinColumn({ name: 'store_id' })
  store: Store;

  @ManyToOne(() => UserProfile, (userProfile) => userProfile.storeUsers)
  @JoinColumn({ name: 'user_profile_id' })
  userProfile: UserProfile;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at', nullable: true })
  deletedAt?: Date;

  static create({
    store,
    userProfile,
  }: {
    store: Store;
    userProfile: UserProfile;
  }): StoreUser {
    const storeUser = new StoreUser();
    storeUser.store = store;
    storeUser.userProfile = userProfile;
    return storeUser;
  }
}
