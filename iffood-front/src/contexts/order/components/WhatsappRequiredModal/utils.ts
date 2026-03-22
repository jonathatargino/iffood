export const formatPhone = (value: string): string =>
  (value || "")
    .replace(/\D/g, "")
    .replace(/^0+/, "")
    .replace(/^(\d{2})(\d)/, "($1) $2")
    .replace(/(\d{5})(\d{4})$/, "$1-$2")
    .replace(/(\d{4})(\d{4})$/, "$1-$2");
