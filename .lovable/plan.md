
Objetivo: fazer a OS 12656 aparecer de forma confiável na busca.

Diagnóstico confirmado
- A OS 12656 existe no banco, está com `deleted = false` e pertence ao usuário atual.
- Portanto, o problema não está no backend nem nas permissões de acesso.
- A busca atual da tabela de Celulares continua frágil porque:
  - carrega uma lista geral primeiro;
  - depois filtra no cliente;
  - depende de estados locais, ordenação e paginação para mostrar o resultado.
- O request atual da lista continua vindo sem filtro direto por OS, então a busca específica ainda não é “determinística”.

Plano de implementação

1. Tornar a busca de número de OS server-side
- Em `src/components/ServiceOrdersTable.tsx`, criar um fluxo específico para busca numérica exata.
- Quando o usuário pesquisar apenas números, aplicar `.eq('os_number', numeroBuscado)` diretamente na consulta.
- Manter o reset dos outros filtros nesse caso, para evitar conflito com situação, técnico, retirada e datas.

2. Remover a dependência da filtragem local para busca exata
- A OS buscada não deve depender de `limit(5000)` nem de filtro posterior em memória.
- O resultado da busca exata deve vir pronto do banco e ser exibido diretamente na tabela.
- `totalCount` e paginação devem refletir o resultado real retornado.

3. Manter texto livre funcionando
- Para buscas por nome/modelo/defeito, preservar a busca ampla.
- Se necessário, separar claramente:
  - busca exata por número de OS;
  - busca textual por nome/modelo/defeito.
- Isso evita misturar dois comportamentos diferentes no mesmo fluxo.

4. Corrigir o mesmo padrão na tabela de Informática
- Aplicar a mesma lógica em `src/components/ServiceOrdersInformaticaTable.tsx`.
- Isso evita o mesmo bug em outro setor e padroniza a experiência.

5. Ajustar estados para evitar conflito visual
- Garantir que ao pesquisar:
  - a página volte para 1;
  - a lista anterior não permaneça visível;
  - o resultado novo substitua corretamente o estado anterior.
- Revisar o uso de `filters`, `appliedFilters`, `orders` e `totalCount` para evitar inconsistência entre o que foi digitado e o que está sendo exibido.

6. Melhorar feedback da busca
- Exibir uma indicação clara quando a busca for “OS exata”.
- Se não houver retorno, mostrar mensagem do tipo:
  - “Nenhuma OS com esse número foi encontrada”
  em vez de parecer que a tabela falhou.

7. Validação final
- Testar especificamente a OS 12656.
- Testar:
  - busca exata por número;
  - busca por nome;
  - busca com filtros antes ativos;
  - ordenação por “Para Quando é o Serviço”;
  - paginação após pesquisar e limpar filtros.

Arquivos a ajustar
- `src/components/ServiceOrdersTable.tsx`
- `src/components/ServiceOrdersInformaticaTable.tsx`

Detalhe técnico
- Hoje a busca específica ainda está baseada em uma consulta ampla seguida de filtro local.
- A correção principal é transformar a busca por número de OS em consulta direta ao banco, eliminando conflitos com ordenação, paginação e estados locais.
