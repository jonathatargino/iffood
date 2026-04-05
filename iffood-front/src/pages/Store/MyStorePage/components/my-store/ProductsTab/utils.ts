export function getProductsTabSectionDescription(totalProducts: number) {
  if (totalProducts === 0) {
    return "Nenhum produto cadastrado";
  }

  if (totalProducts === 1) {
    return "1 produto cadastrado";
  }

  return `${totalProducts} produtos cadastrados`;
}
