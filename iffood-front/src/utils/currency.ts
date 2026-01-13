export const formatCentsToReais = (cents: number): string => {
  const reais = cents / 100;
  return reais.toFixed(2).replace(".", ",");
};

export const formatCentsToReaisWithSymbol = (cents: number): string => {
  return `R$ ${formatCentsToReais(cents)}`;
};

export const formatPriceInput = (value: string): string => {
  const numbers = value.replace(/\D/g, "");

  if (numbers.length === 0) return "";

  const paddedNumbers = numbers.padStart(3, "0");
  const reais = paddedNumbers.slice(0, -2);
  const cents = paddedNumbers.slice(-2);

  return `${parseInt(reais)},${cents}`;
};

export const parsePriceInputToCents = (formattedValue: string): number => {
  const numbers = formattedValue.replace(/\D/g, "");
  return parseInt(numbers) || 0;
};
