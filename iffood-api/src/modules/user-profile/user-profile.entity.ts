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
  @Column({ name: 'user_auth_id' })
  userAuthId: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at', nullable: true })
  deletedAt?: Date;

  @Column()
  private _name: string;

  @Column()
  private _email: string;

  @Column({ name: 'photo_url', nullable: true })
  private _photoUrl?: string;

  @Column({ name: 'whatsapp', nullable: true })
  private _whatsapp?: string;

  get name(): string {
    return this._name;
  }

  get email(): string {
    return this._email;
  }

  get photoUrl(): string | undefined {
    return this._photoUrl;
  }

  get whatsapp(): string | undefined {
    return this._whatsapp;
  }

  setWhatsapp(whatsapp: string) {
    if (!whatsapp || this.whatsapp) return;
    this._whatsapp = whatsapp;
  }

  @OneToMany(() => StoreUser, (storeUser) => storeUser.userProfile, {
    cascade: true,
  })
  storeUsers: StoreUser[];
}
