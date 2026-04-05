export function getAvailabilityTabSectionDescription({
  status,
  isAvailable,
}: {
  status: boolean;
  isAvailable: boolean;
}) {
  if (!status) {
    return "A loja está manualmente definida como indisponível.";
  }

  if (!isAvailable) {
    return "A loja está fora do horário de funcionamento.";
  }

  return "A loja está disponível para os clientes.";
}
