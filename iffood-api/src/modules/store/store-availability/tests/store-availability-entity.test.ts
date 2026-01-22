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
});
