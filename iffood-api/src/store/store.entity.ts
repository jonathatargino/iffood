import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { StoreUser } from '../store-user/store-user.entity';
import { Product } from '../product/product.entity';
import { StoreAvailability } from '../store-availability/store-availability.entity';

@Entity({
  name: 'stores',
})
export class Store {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column()
  description: string;

  @Column()
  whatsapp: string;

  @Column({ name: 'photo_url' })
  photoUrl: string;

  @Column()
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
