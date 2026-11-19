# Atividade 2 – Testes End-to-End

Implementação de testes Playwright + TypeScript para a interface **original** da pasta `atividade/` do professor. Não modifica regras da aplicação.

## Pré-requisitos
- Docker Desktop com WSL 2 ativo
- Node.js e npm

## Execução
Na raiz deste projeto:

```powershell
npm ci
npx playwright install chromium
docker compose -f compose.atividade-e2e.yml up -d --build
npm run test:atividade
```

Para verificar a lista de testes: `npm run test:atividade:list`. Para verificar tipos: `npm run test:atividade:typecheck`.

Interface: http://127.0.0.1:18081

Para encerrar: `docker compose -f compose.atividade-e2e.yml down`

## Isolamento
O Compose usa o projeto `atividade2-e2e`, com PostgreSQL exclusivo, temporário (`tmpfs`) e sem publicar a porta do banco. Cada teste restaura um conjunto conhecido de dois alunos por SQL, usando o banco real. O cenário de lista vazia limpa o mesmo banco de teste. A suíte usa um worker para evitar interferência entre testes.

## Cobertura
Listagem inicial, cadastro válido, mensagem de sucesso, atualização sem recarregamento, limpeza dos campos, persistência após reload, obrigatoriedade dos campos, RA inválido (negativo, zero, decimal e acima de 2147483647), nome inválido inclusive com espaços, RA duplicado e lista vazia.

## Observação
Os testes não foram executados neste ambiente; rode os comandos acima para confirmar o resultado antes de entregar. A pasta `e2e/` e o Compose original do laboratório foram preservados.
