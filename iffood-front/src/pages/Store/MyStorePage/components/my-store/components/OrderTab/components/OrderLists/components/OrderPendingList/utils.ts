export function getOrderPendingListSectionDescription(
  pendingOrdersCount: number,
) {
  if (pendingOrdersCount === 0) {
    return "Nenhum pedido pendente no momento.";
  }

  return `Responda-os para subtrair automaticamente os produtos`;
}
