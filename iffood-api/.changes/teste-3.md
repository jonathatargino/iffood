Refine os scripts C3A e C3B com foco em isolamento de processamento e análise de banco:

    Isolamento de Latência: Em ambos os scripts, refatore a métrica latencyTrend.add para subtrair res.timings.connecting e res.timings.tls_handshaking. Precisamos medir o custo do plano de execução do PostgreSQL e do processamento do TypeORM, não o tempo de rede na AWS.

    Tagging de Granularidade: Adicione a tag tags: { complexity: 'high-coupling' } no 3A e tags: { complexity: 'low-coupling' } no 3B. Isso permitirá gerar um gráfico de dispersão que correlaciona o número de JOINs com o aumento da latência P95.

    Frequência de Amostragem: Nos stages, aumente o tempo de ramp-up do pico (150 a 200 VUs) para 90 segundos. Queries com muitos JOINs (C3A) tendem a causar um "efeito de bola de neve" no pool de conexões do banco de dados que só fica visível após um período de saturação.

    Check de Body Size: No cenário 3A, adicione um check de tamanho de body: 'payload completo': (r) => r.body.length > 500. Como a query acoplada traz muitos dados (reviews, orders), o custo de serialização JSON no NestJS também faz parte do impacto arquitetural que queremos medir.