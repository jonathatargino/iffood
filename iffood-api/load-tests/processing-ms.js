/**
 * Lê processing_ms do header x-processing-ms (tempo de DB após aquisição do pool).
 * k6 normaliza cabeçalhos em minúsculas — não usar mixed-case.
 * Fallback para duration - connecting - tls quando o header não estiver presente.
 */
export function readProcessingMs(res) {
  const raw = res.headers['x-processing-ms'];

  if (raw != null && raw !== '') {
    const headerMs = parseFloat(String(raw));
    if (Number.isFinite(headerMs)) {
      return headerMs;
    }
  }

  return (
    res.timings.duration
    - res.timings.connecting
    - res.timings.tls_handshaking
  );
}
