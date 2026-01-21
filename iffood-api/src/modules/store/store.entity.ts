import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { StoreUser } from './store-user/store-user.entity';
import { Product } from '../product/product.entity';
import { StoreAvailability } from './store-availability/store-availability.entity';
import { STORE_CONSTRAINTS } from '../../common/validation/constraints/store-constraints';
import { InvalidStoreWhatsappError } from './domain/invalid-store-whatsapp.error';
import { InvalidStoreDescriptionError } from './domain/invalid-store-description.error';
import { InvalidStorePhotoUrlError } from './domain/invalid-store-photo-url.error';
import { InvalidStoreNameError } from './domain/invalid-store-name.error';

@Entity({
  name: 'stores',
})
export class Store {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'name', length: STORE_CONSTRAINTS.NAME_MAX })
  private _name: string;

  get name(): string {
    return this._name;
  }

  changeName(name: string) {
    if (
      name.length > STORE_CONSTRAINTS.NAME_MAX ||
      name.length < STORE_CONSTRAINTS.NAME_MIN
    ) {
      throw new InvalidStoreNameError(name);
    }

    this._name = name;
  }

  @Column({ name: 'description', length: STORE_CONSTRAINTS.DESCRIPTION_MAX })
  private _description: string;

  get description(): string {
    return this._description;
  }

  changeDescription(description: string) {
    if (
      description.length > STORE_CONSTRAINTS.DESCRIPTION_MAX ||
      description.length < STORE_CONSTRAINTS.DESCRIPTION_MIN
    ) {
      throw new InvalidStoreDescriptionError(description);
    }

    this._description = description;
  }

  @Column({ name: 'whatsapp', length: STORE_CONSTRAINTS.WHATSAPP_LENGTH })
  private _whatsapp: string;

  get whatsapp(): string {
    return this._whatsapp;
  }

  changeWhatsapp(whatsapp: string) {
    if (whatsapp.length !== STORE_CONSTRAINTS.WHATSAPP_LENGTH) {
      throw new InvalidStoreWhatsappError(whatsapp);
    }

    this._whatsapp = whatsapp;
  }

  @Column({ name: 'photo_url', length: STORE_CONSTRAINTS.PHOTO_URL_MAX })
  private _photoUrl: string;

  get photoUrl(): string {
    return this._photoUrl;
  }

  changePhotoUrl(photoUrl: string) {
    if (photoUrl.length > STORE_CONSTRAINTS.PHOTO_URL_MAX) {
      throw new InvalidStorePhotoUrlError(photoUrl);
    }

    this._photoUrl = photoUrl;
  }

  @Column({ default: true })
  status: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at', nullable: true })
  deletedAt?: Date;

  @OneToMany(() => StoreUser, (storeUser) => storeUser.store)
  storeUsers: StoreUser[];

  @OneToMany(() => Product, (product) => product.store, {
    cascade: ['soft-remove'],
  })
  products: Product[];

  @OneToMany(
    () => StoreAvailability,
    (storeAvailability) => storeAvailability.store,
  )
  storeAvailabilities: StoreAvailability[];
}
