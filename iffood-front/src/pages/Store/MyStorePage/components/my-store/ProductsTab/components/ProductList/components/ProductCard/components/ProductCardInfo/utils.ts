export function getProductCardInfoCountLabel(count: number) {
  if (count === 0) {
    return "Nenhuma opção";
  }

  if (count === 1) {
    return "1 opção";
  }

  return `${count} opções`;
}
