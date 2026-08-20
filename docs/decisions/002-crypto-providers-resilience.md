# ADR 002 — Resiliência de Provedores Crypto e Migração do CoinCap

## Contexto
Durante o deploy no Render (servidores nos EUA), os dois provedores do nosso Circuit Breaker falharam simultaneamente:
1. **Binance API (`api.binance.com`)**: Passou a retornar HTTP 451 (Indisponível por Restrição Geográfica) bloqueando requests de IPs baseados nos EUA.
2. **CoinCap v2 (`api.coincap.io`)**: A API pública e gratuita foi permanentemente descontinuada e o host removido do DNS (NXDOMAIN). A v3 requer chave paga.

Como resultado, a inicialização do cache `getMarkets` e os endpoints principais da nossa API começaram a lançar exceções para o frontend. 

## Alternativas Consideradas

### Para a Binance
- **VPN / Proxy Regional**: Muito complexo para manter e adiciona latência na camada de rede.
- **Usar `api.binance.us`**: Os tokens disponíveis na Binance US são severamente limitados. Grande parte dos ativos globais ficaria com buracos nos dados.
- **Migrar para `data-api.binance.vision` (Escolha Final)**: A Binance fornece esse mirror público sem autenticação especificamente para contornar problemas de interface transacional e geo-blocking em chamadas públicas puras (market data).

### Para o Fallback (CoinCap)
- **CoinGecko API Free**: Extremamente propenso a Rate Limits (`HTTP 429`) se for usado para renderizar 10 moedas em um dashboard, especialmente varrendo volumes de requests.
- **CoinCap v3**: Requer conta, chave e modelo de créditos limitados. Quebra o conceito open-source do projeto.
- **CoinPaprika v1 (Escolha Final)**: API `api.coinpaprika.com/v1/` não requer chave, tem limites de 20.000 requisições por IP, suporte a tickers globais (incluindo OHLCV para `latest`) sem quebrar a consistência da estrutura. É um substituto quase direto em escopo e robustez.

## Decisão Final
A estratégia de múltiplos provedores `ICryptoProvider` provou sua utilidade ao isolar completamente as falhas, permitindo a mudança do adapter:
1. Alteramos os Endpoints Rest e WebSocket da Binance para apontar para `data-api.binance.vision` e `data-stream.binance.vision`.
2. Deletamos o `CoinCapClientService` antigo, criamos o `CoinPaprikaClientService` com mapeamento para a mesma interface e injetamos as dependências correspondentes.

## Raciocínio Staff-Level
Quando uma API de terceiros falha globalmente no ambiente de produção de forma inesperada (como desligamento de servidor ou bloqueio geográfico silenciado), a resiliência não depende mais de "retry patterns", mas de *redundância real de provedor*. O uso do padrão de injeção de dependência na inicialização permitiu que uma reescrita do sistema de origem de dados fosse resolvida apenas alterando o array de injeção `this.providers = [this.binanceClient, this.coinpaprikaClient]` na nossa classe `CryptoService`, deixando os controladores, o front-end e o cálculo estatístico (MathService) completamente ignorantes sobre a crise da fonte. Uma falha crítica solucionada como mera mudança de configuração atesta um bom encapsulamento.

## Trade-offs
O CoinPaprika não fornece um histórico denso gratuito em formato de velas `OHLC` idêntico à Binance. Para compensar, em timeframes maiores (ex: histórico de 7 a 30 dias), extraímos as velas como pseudovelas onde Open = High = Low = Close baseado nos "historical ticks". Visualmente isso gera uma linha de série contínua nas ferramentas de gráficos compatíveis.
