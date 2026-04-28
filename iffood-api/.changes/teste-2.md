
    Isolamento de Latência de Processamento: Assim como no Cenário 1, refatore a medição de latência (latencyTrend.add) para subtrair res.timings.connecting e res.timings.tls_handshaking. No caso do Cache (2B), a latência de rede pode representar 90% do tempo total, então você precisa isolar o tempo de resposta puro do Redis vs. DB.

    Identificação de Cache MISS/HIT: No Cenário 2B, o primeiro acesso de cada VU a uma página nova será um Cache MISS. Instrua o agente a adicionar uma tag dinâmica baseada no res.headers (caso sua API retorne um header tipo X-Cache: HIT/MISS) ou, caso não tenha, logar as iterações que excederam 100ms como prováveis MISS. No TCC, isso permitirá uma análise de "Aquecimento de Cache".

    Tagging de Cenário: Adicione tags: { scenario: 'no-cache' } no 2A e tags: { scenario: 'redis-cache' } no 2B para facilitar a comparação em um único gráfico de barras no capítulo de resultados.

    Monitoramento de I/O: No script 2A, adicione uma instrução no options para monitorar erros de timeout de forma mais estrita. Com 10k registros e 200 VUs, o PostgreSQL pode atingir o limite de IOPS da t3.micro.