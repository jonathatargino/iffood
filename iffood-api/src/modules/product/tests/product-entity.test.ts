import { InvalidProductValueError } from '../domain/errors/invalid-product-value.error';
import { Product, ProductCategory } from '../product.entity';

describe('Product Entity', () => {
  let product: Product;

  beforeEach(() => {
    product = new Product();
  });

  it('(changeValue) should update value when receive valid value', () => {
    const validValue = 1500;

    expect(() => {
      product.changeValue(validValue);
    }).not.toThrow();
    expect(product.value).toBe(validValue);
  });

  it('(changeValue) should throw InvalidProductValueError when receive negative value', () => {
    const invalidValue = -500;

    expect(() => {
      product.changeValue(invalidValue);
    }).toThrow(InvalidProductValueError);
  });

  it('(changePhotoUrl) should update photoUrl when receive valid url', () => {
    const validPhotoUrl = 'http://example.com/photo.jpg';

    expect(() => {
      product.changePhotoUrl(validPhotoUrl);
    }).not.toThrow();
    expect(product.photoUrl).toBe(validPhotoUrl);
  });

  it('(changePhotoUrl) should throw InvalidProductPhotoUrlError when receive invalid url', () => {
    const invalidPhotoUrl = 'invalid-url';

    expect(() => {
      product.changePhotoUrl(invalidPhotoUrl);
    }).toThrow();
  });

  it('(create) should create Product when receive valid data', () => {
    expect(() => {
      const createdProduct = Product.create({
        name: 'Valid Product Name',
        description: 'This is a valid product description.',
        photoUrl: 'http://example.com/photo.jpg',
        value: 1000,
        category: ProductCategory.Savory,
      });

      expect(createdProduct).toBeInstanceOf(Product);
      expect(createdProduct.name).toBe('Valid Product Name');
      expect(createdProduct.description).toBe(
        'This is a valid product description.',
      );
      expect(createdProduct.photoUrl).toBe('http://example.com/photo.jpg');
      expect(createdProduct.value).toBe(1000);
      expect(createdProduct.category).toBe(ProductCategory.Savory);
    }).not.toThrow();
  });

  it('(updateDetails) should update product details when receive valid data', () => {
    const newDetails = {
      name: 'Updated Product Name',
      description: 'This is an updated product description.',
      photoUrl: 'http://example.com/updated-photo.jpg',
      value: 2000,
      category: ProductCategory.Sweet,
    };

    expect(() => {
      product.updateDetails(newDetails);
    }).not.toThrow();

    expect(product.name).toBe(newDetails.name);
    expect(product.description).toBe(newDetails.description);
    expect(product.photoUrl).toBe(newDetails.photoUrl);
    expect(product.value).toBe(newDetails.value);
    expect(product.category).toBe(newDetails.category);
  });

  it('(updateDetails) should ignore undefined values', () => {
    product.changeName('Initial Name');
    product.changeDescription('Initial Description');
    product.changePhotoUrl('http://example.com/initial-photo.jpg');
    product.changeValue(500);
    product.category = ProductCategory.Savory;

    const partialDetails = {
      name: undefined,
      description: 'Partially Updated Description',
      photoUrl: undefined,
      value: 1500,
      category: undefined,
    };

    expect(() => {
      product.updateDetails(partialDetails);
    }).not.toThrow();

    expect(product.name).toBe('Initial Name');
    expect(product.description).toBe(partialDetails.description);
    expect(product.photoUrl).toBe('http://example.com/initial-photo.jpg');
    expect(product.value).toBe(partialDetails.value);
    expect(product.category).toBe(ProductCategory.Savory);
  });
});
