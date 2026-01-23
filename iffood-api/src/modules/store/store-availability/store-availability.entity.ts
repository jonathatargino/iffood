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
import { WeekDay } from './domain/value-objects/week-day.vo';
import { AvailabilityHours } from './domain/value-objects/availability-hours.vo';

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

  @Column({ type: 'time', name: 'start' })
  private _start: string;

  @Column({ type: 'time', name: 'end' })
  private _end: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => Store, (store) => store.storeAvailabilities, {
    orphanedRowAction: 'delete',
  })
  @JoinColumn({ name: 'store_id' })
  store: Store;

  get weekday(): number {
    return this._weekday;
  }

  changeWeekday(weekday: number): void {
    this._weekday = new WeekDay(weekday).getValue();
  }

  get start(): string {
    return this._start;
  }

  get end(): string {
    return this._end;
  }

  changeHours(start: string, end: string): void {
    const availabilityHours = new AvailabilityHours(start, end);

    this._start = availabilityHours.getStart();
    this._end = availabilityHours.getEnd();
  }

  static create({
    end,
    start,
    weekday,
    store,
  }: {
    weekday: number;
    start: string;
    end: string;
    store: Store;
  }): StoreAvailability {
    const storeAvailability = new StoreAvailability();

    storeAvailability.changeWeekday(weekday);
    storeAvailability.changeHours(start, end);
    storeAvailability.store = store;

    return storeAvailability;
  }
}
