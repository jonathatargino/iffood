import { InvalidStorePhotoUrlError } from '../domain/invalid-store-photo-url.error';
import { InvalidWhatsappNumberError } from '../domain/invalid-whatsapp-number-error';
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
});
