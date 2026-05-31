/**
 * Lê processing_ms do header X-Processing-Ms (tempo de DB após aquisição do pool).
 * Fallback para duration - connecting - tls quando o header não estiver presente.
 */
export function readProcessingMs(res) {
  const raw =
    res.headers['X-Processing-Ms'] ?? res.headers['x-processing-ms'];
  const headerMs = raw != null ? parseFloat(raw) : NaN;
  if (Number.isFinite(headerMs)) {
    return headerMs;
  }

  return (
    res.timings.duration
    - res.timings.connecting
    - res.timings.tls_handshaking
  );
}
