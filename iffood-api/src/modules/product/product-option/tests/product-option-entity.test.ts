import { InvalidProductOptionQuantityError } from '../domain/invalid-product-option-quantity.error';
import { ProductOption } from '../product-option.entity';

describe('ProductOption Entity', () => {
  let productOption: ProductOption;

  beforeEach(() => {
    productOption = new ProductOption();
  });

  it('changeQuantity() should update quantity when receive valid quantity', () => {
    const validQuantity = 5;

    expect(() => {
      productOption.changeQuantity(validQuantity);
    }).not.toThrow();
    expect(productOption.quantity).toBe(validQuantity);
  });

  it('changeQuantity() should throw InvalidProductOptionQuantityError when receive negative quantity', () => {
    const invalidQuantity = -1;

    expect(() => {
      productOption.changeQuantity(invalidQuantity);
    }).toThrow(InvalidProductOptionQuantityError);
  });

  it('create() should create ProductOption when receive valid data', () => {
    expect(() => {
      const createdProductOption = ProductOption.create({
        name: 'Valid Option Name',
        quantity: 3,
      });

      expect(createdProductOption).toBeInstanceOf(ProductOption);
      expect(createdProductOption.name).toBe('Valid Option Name');
      expect(createdProductOption.quantity).toBe(3);
    }).not.toThrow();
  });

  it("patch() should update ProductOption's fields when receive valid data", () => {
    productOption.changeName('Old Option Name');
    productOption.changeQuantity(2);

    expect(() => {
      productOption.patch({
        name: 'Updated Option Name',
        quantity: 4,
      });
    }).not.toThrow();

    expect(productOption.name).toBe('Updated Option Name');
    expect(productOption.quantity).toBe(4);
  });

  it('patch() should ignore undefined fields in the input data', () => {
    productOption.changeName('Initial Option Name');
    productOption.changeQuantity(2);

    expect(() => {
      productOption.patch({
        name: undefined,
        quantity: 5,
      });
    }).not.toThrow();

    expect(productOption.name).toBe('Initial Option Name');
    expect(productOption.quantity).toBe(5);
  });
});
