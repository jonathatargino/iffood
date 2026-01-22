import { Store } from '../../store.entity';
import { InvalidAvailabilityHoursError } from '../domain/errors/invalid-availability-hours.error';
import { InvalidMilitaryTimeError } from '../domain/errors/invalid-military-time.error';
import { InvalidStoreAvailabilityWeekdayError } from '../domain/errors/invalid-store-availability-weekday.error';
import { StoreAvailability } from '../store-availability.entity';

describe('StoreAvailability Entity', () => {
  let storeAvailability: StoreAvailability;

  beforeEach(() => {
    storeAvailability = new StoreAvailability();
  });

  it('changeWeekday() should update weekday when receive valid weekday', () => {
    const validWeekday = 3;

    expect(() => {
      storeAvailability.changeWeekday(validWeekday);
    }).not.toThrow();
    expect(storeAvailability.weekday).toBe(validWeekday);
  });

  it('changeWeekday() should throw InvalidStoreAvailabilityWeekdayError when receive invalid weekday', () => {
    const invalidWeekday = 7;

    expect(() => {
      storeAvailability.changeWeekday(invalidWeekday);
    }).toThrow(InvalidStoreAvailabilityWeekdayError);
  });

  it('changeHours() should update hours when receive valid hours', () => {
    const validStart = '09:00';
    const validEnd = '18:00';

    expect(() => {
      storeAvailability.changeHours(validStart, validEnd);
    }).not.toThrow();
    expect(storeAvailability.start).toBe(validStart);
    expect(storeAvailability.end).toBe(validEnd);
  });

  it('changeHours() should throw InvalidAvailabilityHoursError when receive invalid hours', () => {
    const invalidStart = '18:00';
    const invalidEnd = '09:00';

    expect(() => {
      storeAvailability.changeHours(invalidStart, invalidEnd);
    }).toThrow(InvalidAvailabilityHoursError);
  });

  it('changeHours should throw InvalidMilitaryTimeError when receive invalid time format', () => {
    const invalidStart = '9 AM';
    const invalidEnd = '18:00';

    expect(() => {
      storeAvailability.changeHours(invalidStart, invalidEnd);
    }).toThrow(InvalidMilitaryTimeError);
  });

  it('create() should create StoreAvailability when receive valid data', () => {
    const validWeekday = 2;
    const validStart = '10:00';
    const validEnd = '20:00';

    expect(() => {
      const newStoreAvailability = StoreAvailability.create({
        weekday: validWeekday,
        start: validStart,
        end: validEnd,
        store: {} as Store,
      });
      expect(newStoreAvailability.weekday).toBe(validWeekday);
      expect(newStoreAvailability.start).toBe(validStart);
      expect(newStoreAvailability.end).toBe(validEnd);
    }).not.toThrow();
  });
});
