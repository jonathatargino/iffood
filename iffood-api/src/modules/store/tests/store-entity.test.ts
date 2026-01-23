import { InvalidStorePhotoUrlError } from '../domain/invalid-store-photo-url.error';
import { InvalidWhatsappNumberError } from '../domain/invalid-whatsapp-number-error';
import { DuplicatedAvailabilityWeekdayError } from '../store-availability/domain/errors/duplicated-availability-weekday.error';
import { StoreAvailability } from '../store-availability/store-availability.entity';
import { Store } from '../store.entity';

describe('Store Entity', () => {
  let store: Store;

  beforeEach(() => {
    store = new Store();
  });

  it('changeWhatsapp() should update whatsapp when receive valid whatsapp number', () => {
    const validWhatsapp = '85985454176';

    expect(() => {
      store.changeWhatsapp(validWhatsapp);
    }).not.toThrow();
    expect(store.whatsapp).toBe(validWhatsapp);
  });

  it('changeWhatsapp() should throw InvalidWhatsappNumberError when receive invalid whatsapp number', () => {
    const invalidWhatsapp = '+1 3052082154';

    expect(() => {
      store.changeWhatsapp(invalidWhatsapp);
    }).toThrow(InvalidWhatsappNumberError);
  });

  it('changePhotoUrl() should update photoUrl when receive valid url', () => {
    const validPhotoUrl = 'https://example.com/photo.jpg';

    expect(() => {
      store.changePhotoUrl(validPhotoUrl);
    }).not.toThrow();
    expect(store.photoUrl).toBe(new URL(validPhotoUrl).toString());
  });

  it('changePhotoUrl() should throw InvalidStorePhotoUrlError when receive url exceeding max length', () => {
    const longUrl = 'https://example.com/' + 'a'.repeat(2048) + '.jpg';

    expect(() => {
      store.changePhotoUrl(longUrl);
    }).toThrow(InvalidStorePhotoUrlError);
  });

  it('changePhotoUrl() should throw InvalidStorePhotoUrlError when receive invalid url', () => {
    const invalidUrl = 'invalid-url';

    expect(() => {
      store.changePhotoUrl(invalidUrl);
    }).toThrow(InvalidStorePhotoUrlError);
  });

  it('create() should create store when receive valid properties', () => {
    const props = {
      name: 'Test Store',
      description: 'A store for testing',
      whatsapp: '85985454176',
      photoUrl: 'https://example.com/photo.jpg',
    };

    const createdStore = Store.create(props);

    expect(createdStore).toBeDefined();
    expect(createdStore.name).toBe(props.name);
    expect(createdStore.description).toBe(props.description);
    expect(createdStore.whatsapp).toBe(props.whatsapp);
    expect(createdStore.photoUrl).toBe(new URL(props.photoUrl).toString());
  });

  it("setAvailabilities() should set store's availabilities when receive valid availabilities", () => {
    const availabilities = [
      {
        weekday: 1,
        startTime: '09:00',
        endTime: '18:00',
      },
      {
        weekday: 2,
        startTime: '10:00',
        endTime: '17:00',
      },
    ].map((data) => {
      const availability = StoreAvailability.create({
        weekday: data.weekday,
        start: data.startTime,
        end: data.endTime,
        store: { id: 'some-store-id' } as Store,
      });
      return availability;
    });

    store.storeAvailabilities = [];

    expect(() => {
      store.setAvailabilities(availabilities);
    }).not.toThrow();
    expect(store.storeAvailabilities).toHaveLength(2);
  });

  it('setAvailabilities() should throw DuplicatedAvailabilityWeekdayError when receive availabilities with duplicated weekdays', () => {
    const availabilities = [
      {
        weekday: 1,
        startTime: '09:00',
        endTime: '18:00',
      },
      {
        weekday: 1,
        startTime: '10:00',
        endTime: '17:00',
      },
    ].map((data) => {
      const availability = StoreAvailability.create({
        weekday: data.weekday,
        start: data.startTime,
        end: data.endTime,
        store: { id: 'some-store-id' } as Store,
      });
      return availability;
    });

    store.storeAvailabilities = [];

    expect(() => {
      store.setAvailabilities(availabilities);
    }).toThrow(DuplicatedAvailabilityWeekdayError);
  });
});
