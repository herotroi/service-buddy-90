
# Plano: Corrigir Ordenação "Para Quando é o Serviço"

## Problema Identificado

A lógica atual de ordenação está incorreta. Ela está fazendo:
1. Todas as datas futuras primeiro (da mais próxima à mais distante)
2. Todas as datas passadas depois (da mais recente à mais antiga)

O usuário quer: **ordenação unificada por proximidade absoluta ao momento atual**, sem separar futuras e passadas.

## Exemplo do Comportamento Esperado

Se hoje é 28/01/2026:
| Data | Distância | Ordem Esperada |
|------|-----------|----------------|
| 29/01 | 1 dia (futuro) | 1º |
| 27/01 | 1 dia (passado) | 2º |
| 30/01 | 2 dias (futuro) | 3º |
| 25/01 | 3 dias (passado) | 4º |
| 15/01 | 13 dias (passado) | 5º |
| 14/01 | 14 dias (passado) | 6º |

## Alterações Necessárias

### 1. ServiceOrdersTable.tsx
- Modificar a função de ordenação para usar `Math.abs(dateA - now)` vs `Math.abs(dateB - now)`
- Remover a lógica que separa futuras de passadas
- Manter nulls no final

### 2. ServiceOrdersInformaticaTable.tsx
- Aplicar a mesma correção de ordenação
- Garantir consistência entre as duas tabelas

## Detalhes Técnicos

A nova lógica será:

```javascript
if (sortBy === 'service_date') {
  const now = new Date().getTime();
  
  // Nulls vão para o final
  if (!dateA && !dateB) return 0;
  if (!dateA) return 1;
  if (!dateB) return -1;
  
  // Ordenar pela distância absoluta ao momento atual
  const diffA = Math.abs(dateA - now);
  const diffB = Math.abs(dateB - now);
  
  return diffA - diffB; // Menor diferença = mais próximo = primeiro
}
```

Esta é exatamente a lógica que o usuário solicitou originalmente ("ordem do mais proximo ao meu momento atual").
