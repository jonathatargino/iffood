import { Store } from '../../../store/store.entity';
import { Product, ProductCategory } from '../../product.entity';
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
        product: { id: 'fake-product-id' } as Product,
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

  it("addOption() should add a ProductOption to the Product's productOptions array", () => {
    const product = Product.create({
      name: 'Test Product',
      description: 'Test Description',
      photoUrl: 'http://example.com/photo.jpg',
      value: 100,
      category: ProductCategory.Savory,
      store: { id: 'fake-store-id' } as Store,
    });

    product.productOptions = [];

    const optionToAdd = ProductOption.create({
      name: 'New Option',
      quantity: 10,
      product,
    });

    expect(() => {
      product.addOption(optionToAdd);
    }).not.toThrow();

    expect(product['productOptions']).toContain(optionToAdd);
  });

  it('applyOptionsChange() should correctly process new, updated, and deleted options', () => {
    const product = Product.create({
      name: 'Test Product',
      description: 'Test Description',
      photoUrl: 'http://example.com/photo.jpg',
      value: 100,
      category: ProductCategory.Savory,
      store: { id: 'fake-store-id' } as Store,
    });

    product.productOptions = [];

    const existingOption1 = ProductOption.create({
      name: 'Option 1',
      quantity: 10,
      product,
    });
    existingOption1.id = 'existing-option-1-id';
    const existingOption2 = ProductOption.create({
      name: 'Option 2',
      quantity: 20,
      product,
    });
    existingOption2.id = 'existing-option-2-id';
    const existingOption3 = ProductOption.create({
      name: 'Option 3',
      quantity: 20,
      product,
    });

    product.addOption(existingOption1);
    product.addOption(existingOption2);
    product.addOption(existingOption3);

    const changes = {
      new: [{ name: 'New Option', quantity: 5 }],
      updated: [
        { id: existingOption1.id, name: 'Updated Option 1', quantity: 15 },
      ],
      deleted: [
        { id: existingOption2.id, name: 'Deleted Option 1', quantity: 15 },
      ],
    };

    const result = product.applyOptionsChange(changes);

    expect(product['productOptions'].length).toBe(3);
    expect(product['productOptions']).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: 'Updated Option 1', quantity: 15 }),
        expect.objectContaining({ name: 'New Option', quantity: 5 }),
        expect.objectContaining({ name: 'Option 3', quantity: 20 }),
      ]),
    );
    expect(result.toDelete).toEqual([existingOption2]);
  });
});
