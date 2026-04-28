Aplique o rigor experimental final nos scripts sync-test.js e async-test.js:

    Isolamento de Processamento: Assim como nos cenários anteriores, refatore latency.add(res.timings.duration) para subtrair res.timings.connecting e res.timings.tls_handshaking. No modo assíncrono, queremos medir o custo puro do enfileiramento no SQS vs. o custo do lock no banco no modo síncrono.

    Medição de Tempo de Fila (Opcional, mas de elite): No script async-test.js, se possível, adicione um Trend customizado chamado total_business_latency. Como o k6 não vê o worker, instrua o agente a sugerir como você pode coletar o timestamp de "finalizado" no banco para comparar com o "recebido" na API.

    Ramp-up de Stress: Aumente o target final do último stage para 200 VUs. Como você está usando t3.small e SQS, 100 VUs pode ser pouco para mostrar o "estouro" do modelo síncrono. Queremos ver o ponto onde o modo síncrono começa a dar 5xx e o assíncrono continua dando 202.

    Tagging de Reprodutibilidade: Adicione uma tag run_id que pode ser passada via __ENV para facilitar a separação de diferentes rodadas de teste no seu banco de resultados.