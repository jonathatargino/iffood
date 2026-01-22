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
});
