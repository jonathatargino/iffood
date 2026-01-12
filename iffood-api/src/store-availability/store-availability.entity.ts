import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Store } from '../store/store.entity';

@Entity({
  name: 'store_availabilities',
})
export class StoreAvailability {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  weekday: number;

  @Column({ type: 'time' })
  start: string;

  @Column({ type: 'time' })
  end: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => Store, (store) => store.storeAvailabilities)
  @JoinColumn({ name: 'store_id' })
  store: Store;
}
