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
import { InvalidStoreDescriptionError } from './domain/invalid-store-description.error';
import { InvalidStorePhotoUrlError } from './domain/invalid-store-photo-url.error';
import { InvalidStoreNameError } from './domain/invalid-store-name.error';
import { WhatsappNumber } from './domain/value-objects/whatsapp-number.vo';

@Entity({
  name: 'stores',
})
export class Store {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'name', length: STORE_CONSTRAINTS.NAME_MAX })
  private _name: string;

  @Column({ name: 'description', length: STORE_CONSTRAINTS.DESCRIPTION_MAX })
  private _description: string;

  @Column({ name: 'whatsapp', length: STORE_CONSTRAINTS.WHATSAPP_LENGTH })
  private _whatsapp: string;

  @Column({ name: 'photo_url', length: STORE_CONSTRAINTS.PHOTO_URL_MAX })
  private _photoUrl: string;

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

  get whatsapp(): string {
    return this._whatsapp;
  }

  changeWhatsapp(whatsapp: string) {
    this._whatsapp = new WhatsappNumber(whatsapp).getValue();
  }

  get photoUrl(): string {
    return this._photoUrl;
  }

  changePhotoUrl(photoUrl: string) {
    let url: string;
    try {
      url = new URL(photoUrl).toString();
    } catch {
      throw new InvalidStorePhotoUrlError(photoUrl);
    }

    if (url.length > STORE_CONSTRAINTS.PHOTO_URL_MAX) {
      throw new InvalidStorePhotoUrlError(photoUrl);
    }

    this._photoUrl = url;
  }

  static create(props: {
    name: string;
    description: string;
    whatsapp: string;
    photoUrl: string;
  }): Store {
    const store = new Store();

    store.changeName(props.name);
    store.changeDescription(props.description);
    store.changeWhatsapp(props.whatsapp);
    store.changePhotoUrl(props.photoUrl);
    store.status = true;

    return store;
  }
}
