import {
  Check,
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Store } from '../store.entity';
import { STORE_AVAILABILITY_CONSTRAINTS } from '../../../common/validation/constraints/store-availability-constraints';
import { InvalidStoreAvailabilityStartError } from './domain/errors/invalid-store-availability-start.error';
import { InvalidStoreAvailabilityEndError } from './domain/errors/invalid-store-availability-end.error';
import { WeekDay } from './domain/value-objects/week-day';

@Check(
  `"weekday" >= ${STORE_AVAILABILITY_CONSTRAINTS.WEEKDAY_MIN} AND "weekday" <= ${STORE_AVAILABILITY_CONSTRAINTS.WEEKDAY_MAX}`,
)
@Entity({
  name: 'store_availabilities',
})
export class StoreAvailability {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'weekday' })
  private _weekday: number;

  get weekday(): number {
    return this._weekday;
  }

  changeWeekday(weekday: number): void {
    this._weekday = new WeekDay(weekday).getValue();
  }

  @Column({ type: 'time', name: 'start' })
  private _start: string;

  get start(): string {
    return this._start;
  }

  changeStart(start: string): void {
    if (start.length !== STORE_AVAILABILITY_CONSTRAINTS.START_LENGTH) {
      throw new InvalidStoreAvailabilityStartError(start);
    }

    this._start = start;
  }

  @Column({ type: 'time', name: 'end' })
  private _end: string;

  get end(): string {
    return this._end;
  }

  changeEnd(end: string): void {
    if (end.length !== STORE_AVAILABILITY_CONSTRAINTS.END_LENGTH) {
      throw new InvalidStoreAvailabilityEndError(end);
    }

    this._end = end;
  }

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => Store, (store) => store.storeAvailabilities)
  @JoinColumn({ name: 'store_id' })
  store: Store;
}
