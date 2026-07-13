# Especificação dos cards

- Significado dos dados;
- Parâmetros públicos;
- Defaults;
- Filtros;
- Regras de seleção;
- Estados;
- Dimensões;
- Conteúdo;
- Acessibilidade;
- Comportamento de erro;
- Critérios de teste.

Os exemplos usam o provedor GitHub.

---

## Convenções comuns

### Rota

```text
GET /api/cards/<card>.svg
```

### Formato

```http
Content-Type: image/svg+xml; charset=utf-8
```

### Método

Somente `GET` e `HEAD` são aceitos.

`HEAD` retorna os mesmos cabeçalhos de `GET`, sem body.

### Nome de parâmetros

Parâmetros públicos usam `snake_case`.

Exemplos:

```text
hide_border=true
show_commit=false
include_forks=true
```

### Booleanos

Valores aceitos:

```text
true
false
1
0
```

A comparação ignora maiúsculas em `true` e `false`.

### Listas

Listas usam vírgula:

```text
exclude=repo-a,repo-b,repo-c
```

- Espaços laterais são removidos;
- Itens vazios são descartados;
- Duplicatas são removidas sem alterar a primeira ordem encontrada.

### Texto acessível

O SVG inclui:

```xml
<title>...</title>
<desc>...</desc>
```

O elemento raiz usa `role="img"` e referencia título e descrição por `aria-labelledby`.

---

## Parâmetros comuns

| Parâmetro | Tipo | Obrigatório | Padrão | Regras |
|---|---|---|---|---|
| `username` | string | sim | — | login válido do GitHub |
| `theme` | enum | não | `github-dark` | tema registrado |
| `locale` | enum | não | `pt-BR` | `pt-BR` ou `en-US` |
| `width` | inteiro | não | por card | 320 a 1200 |
| `hide_border` | boolean | não | `false` | remove borda externa |
| `background` | hex | não | tema | 6 caracteres, sem `#` |
| `foreground` | hex | não | tema | 6 caracteres, sem `#` |
| `accent` | hex | não | tema | 6 caracteres, sem `#` |
| `border` | hex | não | tema | 6 caracteres, sem `#` |

### Precedência de estilo

1. Tema solicitado;
2. Tema padrão quando inválido;
3. Sobrescritas válidas;
4. Proteção de contraste;
5. Valores finais.

### Locale

`pt-BR` usa rótulos em português:

```text
agora
há 8 minutos
há 2 horas
há 4 dias
```

`en-US` usa:

```text
now
8 minutes ago
2 hours ago
4 days ago
```

Datas além do limite de forma relativa usam formato curto local.

---

# Now Building

## Significado

O card mostra:

- O repositório indicado por `repository`; ou
- O repositório elegível com atividade mais recente.

O card não afirma que o projeto está aberto no editor nem que existe uma sessão de programação ativa.

O rótulo **Now Building** representa destaque por atividade recente.

---

## Rota

```text
GET /api/cards/now-building.svg
```

---

## Dimensões

| Propriedade | Valor |
|---|---:|
| Largura padrão | 600 |
| Largura mínima | 360 |
| Largura máxima | 1000 |
| Altura base | 210 |
| Altura compacta | 170 |

A largura altera distribuição horizontal e a altura depende da combinação de campos visíveis.

---

## Parâmetros

| Parâmetro | Tipo | Padrão | Descrição |
|---|---|---|---|
| `repository` | string | automático | Nome do repositório em destaque |
| `branch` | string | branch padrão | Branch usada na consulta de commit |
| `exclude` | lista | vazia | Repositórios ignorados na seleção automática |
| `include_forks` | boolean | `false` | Considera forks |
| `include_archived` | boolean | `false` | Considera arquivados |
| `show_description` | boolean | `true` | Exibe descrição do repositório |
| `show_commit` | boolean | `true` | Exibe mensagem do commit mais recente |
| `show_language` | boolean | `true` | Exibe linguagem principal |
| `show_branch` | boolean | `true` | Exibe branch |
| `show_updated` | boolean | `true` | Exibe data relativa |
| `compact` | boolean | `false` | Usa versão reduzida |

### Restrições

- `repository` aceita somente o nome, sem proprietário;
- `branch` possui limite de 255 caracteres;
- `exclude` aceita no máximo 25 itens;
- `compact=true` oculta descrição por padrão, salvo sobrescrita explícita;
- Branch inexistente resulta em fallback para branch padrão com indicador degradado.

---

## Seleção automática

Repositórios são elegíveis quando:

- Pertencem ao usuário consultado;
- Estão visíveis para o token da aplicação;
- Não aparecem em `exclude`;
- Não estão arquivados, salvo `include_archived=true`;
- Não são forks, salvo `include_forks=true`;
- Possuem `pushedAt`.

A ordenação usa:

1. `pushedAt` decrescente;
2. `updatedAt` decrescente;
3. Nome em ordem lexicográfica para desempate.

O primeiro item é selecionado.

### Repositório explícito

Quando `repository=projectscope.dynamic-svg`:

- A seleção automática é ignorada;
- O provider consulta o repositório diretamente;
- Filtros de arquivado e fork continuam aplicados;
- `exclude` também continua válido;
- Usuário e repositório precisam formar uma combinação válida.

---

## Commit

A mensagem exibida usa somente a primeira linha.

Entrada:

```text
feat: add card renderer

This commit also adds tests and fixtures.
```

Saída:

```text
feat: add card renderer
```

Regras:

- Normalizar espaços;
- Remover quebras;
- Escapar XML;
- Truncar visualmente;
- Não exibir corpo;
- Não exibir autor por padrão;
- Não interpretar Markdown.

Quando não existe commit acessível:

- O card continua com dados do repositório;
- A linha de commit é omitida;
- `degraded=true` entra nos metadados internos.

---

## Estado de atividade

| Tempo desde `pushedAt` | Estado | Rótulo visual |
|---|---|---|
| até 1 hora | active | Atividade agora |
| até 24 horas | recent | Ativo hoje |
| até 7 dias | warm | Ativo nesta semana |
| até 30 dias | quiet | Atividade recente |
| acima de 30 dias | idle | Em repouso |

O estado altera somente elementos visuais secundários (o conteúdo continua legível em escala de cinza).

---

## Hierarquia visual

Ordem de leitura:

1. Rótulo do card;
2. Nome do repositório;
3. Descrição;
4. Commit;
5. Metadados;
6. Atualização relativa.

```text
┌──────────────────────────────────────────────────────────┐
│ ● NOW BUILDING                                           │
│                                                          │
│ projectscope.dynamic-svg                                 │
│ SVGs dinâmicos para projetos e atividade                 │
│                                                          │
│ feat: initialize TypeScript structure                    │
│ TypeScript  •  prod  •  atualizado há 12 minutos         │
└──────────────────────────────────────────────────────────┘
```

---

## Layout compacto

O modo compacto exibe:

- Rótulo;
- Repositório;
- Commit, quando habilitado;
- Metadados em uma linha.

Descrição fica oculta por padrão.

Exemplo:

```text
┌──────────────────────────────────────────────────────────┐
│ NOW BUILDING                                             │
│ projectscope.dynamic-svg                                 │
│ feat: add project radar                                  │
│ TypeScript • prod • há 12 min                            │
└──────────────────────────────────────────────────────────┘
```

---

## Exemplos

### Automático

```text
/api/cards/now-building.svg?username=vitoroliveirasilva
```

### Repositório definido

```text
/api/cards/now-building.svg?username=vitoroliveirasilva&repository=projectscope.dynamic-svg
```

### Compacto

```text
/api/cards/now-building.svg?username=vitoroliveirasilva&compact=true
```

### Sem commit e branch

```text
/api/cards/now-building.svg?username=vitoroliveirasilva&show_commit=false&show_branch=false
```

### Com exclusões

```text
/api/cards/now-building.svg?username=vitoroliveirasilva&exclude=profile,archive-repo
```

---

## Estados de erro

| Situação | Código | Mensagem pública |
|---|---|---|
| `username` ausente | `INVALID_REQUEST` | Informe um usuário |
| usuário inexistente | `NOT_FOUND` | Usuário não encontrado |
| repositório inexistente | `NOT_FOUND` | Projeto não encontrado |
| nenhum elegível | `NO_DATA` | Nenhum projeto disponível |
| rate limit | `RATE_LIMITED` | Dados temporariamente indisponíveis |
| falha externa | `PROVIDER_UNAVAILABLE` | Não foi possível consultar os projetos |

---

## Testes mínimos

- Seleção do repositório mais recente;
- Desempate;
- Exclusão;
- Fork;
- Arquivado;
- Repositório explícito;
- Branch explícita;
- Fallback de branch;
- Commit sem corpo;
- Mensagem longa;
- Descrição nula;
- Linguagem nula;
- Estado de atividade;
- Modo compacto;
- Locale;
- Tema;
- Cor inválida;
- Usuário ausente;
- Nenhum projeto;
- Provider indisponível;
- XML válido;
- Ausência de tags proibidas.

---

# Project Radar

## Significado

O card representa projetos como pontos em uma área orbital. Assim, a proximidade visual e a intensidade comunicam atividade relativa dentro do conjunto selecionado e além disso, é importante considerar que o radar não representa dependência entre projetos, popularidade absoluta ou progresso percentual.

---

## Rota

```text
GET /api/cards/project-radar.svg
```

---

## Dimensões

| Propriedade | Valor |
|---|---:|
| Largura padrão | 640 |
| Largura mínima | 420 |
| Largura máxima | 1200 |
| Altura padrão | 420 |
| Proporção | 16:10 |

A altura deriva da largura dentro de limites definidos.

---

## Parâmetros

| Parâmetro | Tipo | Padrão | Descrição |
|---|---|---|---|
| `limit` | inteiro | `6` | Quantidade de projetos |
| `exclude` | lista | vazia | Repositórios ignorados |
| `include_forks` | boolean | `false` | Inclui forks |
| `include_archived` | boolean | `false` | Inclui arquivados |
| `labels` | boolean | `true` | Exibe nomes |
| `show_language` | boolean | `true` | Exibe linguagem nos metadados visuais |
| `sort` | enum | `activity` | Critério de entrada no limite |
| `layout` | enum | `orbit` | Estratégia de posicionamento |
| `center_label` | string | username | Texto central sanitizado |

Valores aceitos:

```text
sort=activity
layout=orbit
```

O contrato limita opções ao que possui comportamento implementado e testado.

---

## Seleção

Regras de elegibilidade iguais às do Now Building:

- Proprietário correto;
- Visibilidade permitida;
- Exclusões;
- Forks conforme parâmetro;
- Arquivados conforme parâmetro;
- Atividade conhecida.

A ordenação `activity` usa:

1. Nível de atividade;
2. `pushedAt`;
3. `updatedAt`;
4. Nome.

O limite é aplicado após filtros e ordenação.

---

## Nível de atividade

```ts
type ActivityLevel = 0 | 1 | 2 | 3 | 4 | 5;
```

| Dias desde push | Nível |
|---:|---:|
| Sem data | 0 |
| Acima de 90 | 1 |
| 31 a 90 | 2 |
| 8 a 30 | 3 |
| 2 a 7 | 4 |
| 0 a 1 | 5 |

Uso visual:

| Nível | Raio do ponto | Opacidade | Ênfase do rótulo |
|---|---|---|---|
| 1 | Pequeno | Baixa | Discreta |
| 2 | Pequeno | Média | Discreta |
| 3 | Médio | Média | Normal |
| 4 | Grande | Alta | Normal |
| 5 | Máximo | Máxima | Forte |

O card não depende somente de cor para representar nível (tamanho e opacidade também mudam).

---

## Posicionamento orbital

### Centro

- Identificador do usuário;
- Rótulo "PROJECT RADAR";
- Elemento visual central.

### Órbitas

A quantidade de órbitas depende do limite:

| Projetos | Órbitas |
|---|---|
| 1 a 4 | 1 |
| 5 a 8 | 2 |
| 9 a 12 | 3 |

### Hash determinístico

O nome completo gera um inteiro estável:

```text
vitoroliveirasilva/projectscope.dynamic-svg
```

O hash determina:

- Ângulo base;
- Deslocamento radial limitado;
- Lado preferencial do rótulo.

A atividade não altera o ângulo. Assim, pequenas mudanças de data não fazem os pontos "saltarem" pelo card.

### Colisão

O algoritmo verifica caixas aproximadas de rótulos.

1. Calcula a posição inicial;
2. Calcula a caixa do rótulo;
3. Detecta a interseções;
4. Tenta deslocamentos angulares pequenos;
5. Alterna alinhamento;
6. Oculta metadado secundário quando necessário;
7. Trunca rótulo;
8. Preserva o ponto mesmo quando o rótulo não cabe.

---

## Rótulos

Com `labels=true`, cada projeto exibe nome curto.

- Remove proprietário;
- Preserva pontos e hífens;
- Trunca visualmente;
- Usa `text-anchor` conforme posição;
- Evita sobreposição com o centro;
- Nunca insere HTML;
- Linguagem aparece como texto secundário quando o espaço permite.

Com `labels=false` o SVG continua acessível pela descrição geral, mas não oferece identificação visual individual (esse modo prioriza composição decorativa).

---

## Hierarquia visual

```text
┌──────────────────────────────────────────────────────────┐
│ PROJECT RADAR                                            │
│                                                          │
│                        sourcewise ●                      │
│                                                          │
│       ● epub-repair       VITOR       projectscope ●     │
│                                                          │
│                       ○ mhs-pricing                      │
│                                                          │
│  Atividade baseada no último push                        │
└──────────────────────────────────────────────────────────┘
```

O rodapé informa o significado da atividade para impedir interpretação como porcentagem de progresso.

---

## Exemplos

### Padrão

```text
/api/cards/project-radar.svg?username=vitoroliveirasilva
```

### Doze projetos

```text
/api/cards/project-radar.svg?username=vitoroliveirasilva&limit=12
```

### Sem rótulos

```text
/api/cards/project-radar.svg?username=vitoroliveirasilva&labels=false
```

### Incluindo forks

```text
/api/cards/project-radar.svg?username=vitoroliveirasilva&include_forks=true
```

### Exclusões

```text
/api/cards/project-radar.svg?username=vitoroliveirasilva&exclude=profile,old-project
```

---

## Estados vazios

### Nenhum projeto elegível

O card mantém o radar e exibe:

```text
Nenhum projeto disponível
```

### Menos projetos que o limite

O card usa somente os projetos disponíveis (espaços vazios não recebem placeholders).

### Linguagem ausente

O ponto continua normal (o metadado de linguagem é omitido).

---

## Estados de erro

| Situação | Código | Mensagem pública |
|---|---|---|
| Limite inválido | `INVALID_REQUEST` | Limite fora do intervalo aceito |
| Usuário inexistente | `NOT_FOUND` | Usuário não encontrado |
| Nenhum elegível | `NO_DATA` | Nenhum projeto disponível |
| Rate limit | `RATE_LIMITED` | Dados temporariamente indisponíveis |
| Falha externa | `PROVIDER_UNAVAILABLE` | Não foi possível consultar os projetos |

---

## Testes mínimos

- Limite mínimo;
- Limite máximo;
- Limite inválido;
- Filtros;
- Ordenação;
- Níveis 0 a 5;
- Hash estável;
- Posição estável;
- Múltiplas órbitas;
- Colisão de rótulos;
- Nome longo;
- Labels desativadas;
- Linguagem ausente;
- Lista vazia;
- Tema transparente;
- Largura mínima e máxima;
- Locale;
- XML válido;
- Ausência de scripts;
- Saída determinística.

---

# Temas e acessibilidade

## Requisitos de contraste

- Texto principal e fundo mantêm contraste alto;
- Texto secundário permanece legível;
- Cores de atividade nunca são o único sinal;
- Bordas não são essenciais para interpretar conteúdo;
- Tema transparente preserva contorno ou sombra de texto quando necessário.

## Movimento

A versão inicial não depende de animação.

Quando uma animação SVG existe, ela respeita redução de movimento por CSS sempre que o ambiente consumidor oferece suporte:

```css
@media (prefers-reduced-motion: reduce) {
  .animated {
    animation: none;
  }
}
```

A informação permanece completa sem movimento.

## Leitores de tela

Cada card possui título e descrição coerentes.

Exemplo Now Building:

```xml
<title id="title">Projeto em desenvolvimento de Vitor Oliveira Silva</title>
<desc id="description">
  O projeto mais recentemente ativo é projectscope.dynamic-svg, atualizado há 12 minutos.
</desc>
```

Exemplo Project Radar:

```xml
<title id="title">Radar de projetos de Vitor Oliveira Silva</title>
<desc id="description">
  Radar com seis projetos ordenados por atividade recente.
</desc>
```

---

# Versionamento do contrato

O contrato público possui versão interna.

Mudanças compatíveis:

- Novo parâmetro opcional;
- Novo tema;
- Novo locale;
- Melhoria de layout sem alterar significado;
- Novo card;
- Cabeçalho adicional não sensível.

Mudanças incompatíveis:

- Renomear parâmetro;
- Mudar default com impacto visual forte;
- Remover tema;
- Mudar significado de atividade;
- Alterar rota;
- Reduzir limites aceitos;
- Remover conteúdo documentado.

Mudanças incompatíveis usam rota ou parâmetro de versão explícito, em vez de quebrar URLs existentes silenciosamente.