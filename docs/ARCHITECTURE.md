# Arquitetura

## Contexto

O ProjectScope entrega SVGs por URL, portanto a página consumidora trata cada resposta como uma imagem externa. Desse modo, algumas restrições são criadas:

- O consumidor não executa código do projeto;
- O card precisa chegar pronto para renderização;
- A resposta não pode depender de JavaScript no navegador;
- Erros também precisam resultar em uma imagem válida;
- O cache do navegador, da CDN e do proxy de imagens influencia a atualização;
- O conteúdo deve funcionar em ambientes que sanitizam SVG;
- Textos de APIs externas entram como conteúdo não confiável;
- A URL pública representa um contrato de integração.

---

## Visão de componentes

```text
Consumidor
README, portfólio, página web
        │
        │ GET /api/cards/<card>.svg?... 
        ▼
Camada HTTP / Netlify Function
        │
        ├── parse de query string
        ├── contexto da requisição
        ├── cabeçalhos e status
        └── tradução de erro para SVG
        │
        ▼
Caso de uso do card
        │
        ├── valida parâmetros específicos
        ├── solicita dados normalizados
        ├── seleciona e calcula o modelo visual
        └── chama o renderer
        │
        ▼
Provider e cache
        │
        ├── consulta cache
        ├── chama GitHub REST API
        ├── normaliza respostas
        └── devolve modelos internos
        │
        ▼
Núcleo de renderização
        │
        ├── tema
        ├── tipografia
        ├── escape XML
        ├── truncamento
        ├── componentes SVG
        └── documento final
        │
        ▼
image/svg+xml
```

---

## Estrutura de diretórios

```text
src/
├── cards/
│   ├── now-building/
│   │   ├── index.ts
│   │   ├── model.ts
│   │   ├── select.ts
│   │   └── render.ts
│   └── project-radar/
│       ├── index.ts
│       ├── model.ts
│       ├── score.ts
│       └── render.ts
├── core/
│   ├── cache/
│   │   ├── cache.ts
│   │   ├── keys.ts
│   │   └── memory-cache.ts
│   ├── errors/
│   │   ├── app-error.ts
│   │   ├── error-codes.ts
│   │   └── render-error-card.ts
│   ├── http/
│   │   ├── card-response.ts
│   │   ├── headers.ts
│   │   └── query.ts
│   ├── render/
│   │   ├── document.ts
│   │   ├── escape.ts
│   │   ├── text.ts
│   │   └── primitives.ts
│   ├── themes/
│   │   ├── registry.ts
│   │   ├── resolve-theme.ts
│   │   └── theme.ts
│   └── validation/
│       ├── color.ts
│       ├── common-params.ts
│       ├── dimensions.ts
│       └── primitives.ts
├── providers/
│   └── github/
│       ├── github-client.ts
│       ├── github-provider.ts
│       ├── github-types.ts
│       ├── normalize.ts
│       └── rate-limit.ts
└── shared/
    ├── clock.ts
    ├── hash.ts
    ├── locale.ts
    └── types.ts
```

### Regra de dependência

A direção das dependências permanece:

```text
functions → cards → providers/core/shared
```

- O núcleo não importa cards
- O provider não importa renderers
- Um card conhece apenas interfaces e modelos internos

---

## Camada de funções

Cada card possui uma Netlify Function dedicada:

```text
netlify/functions/now-building.ts
netlify/functions/project-radar.ts
```

A função contém somente adaptação HTTP:

1. Recebe o evento;
2. Converte query string em entrada bruta;
3. Cria dependências;
4. Executa o caso de uso do card;
5. Transforma o resultado em resposta SVG;
6. Captura erros conhecidos e inesperados;
7. Aplica cabeçalhos.

A função não contém:

- Regras de seleção de repositório;
- Cálculo de score;
- Construção manual de SVG;
- Chamadas diretas espalhadas para o GitHub;
- Leitura direta de variáveis de ambiente em vários pontos;
- Lógica específica de tema.

Exemplo de forma conceitual:

```ts
export const handler = createCardHandler({
  name: "now-building",
  execute: renderNowBuildingCard,
});
```

O adaptador `createCardHandler` padroniza método permitido, headers, erro e medição de duração.

---

## Contratos internos

### RepositorySummary

O provider normaliza respostas externas para um modelo controlado:

```ts
export interface RepositorySummary {
  owner: string;
  name: string;
  fullName: string;
  description: string | null;
  url: string;
  defaultBranch: string;
  primaryLanguage: string | null;
  isFork: boolean;
  isArchived: boolean;
  isPrivate: boolean;
  pushedAt: Date | null;
  updatedAt: Date;
}
```

Nenhum renderer recebe a resposta crua da API do GitHub.

### CommitSummary

```ts
export interface CommitSummary {
  sha: string;
  shortSha: string;
  message: string;
  url: string;
  branch: string;
  authoredAt: Date | null;
  committedAt: Date | null;
}
```

A mensagem contém somente a primeira linha após normalização e truncamento.

### CardResult

```ts
export interface CardResult {
  body: string;
  width: number;
  height: number;
  cacheKey: string;
  lastModified?: Date;
  metadata: {
    card: string;
    provider: string;
    degraded: boolean;
  };
}
```

### CardError

```ts
export interface CardError {
  code:
    | "INVALID_REQUEST"
    | "NOT_FOUND"
    | "NO_DATA"
    | "RATE_LIMITED"
    | "PROVIDER_UNAVAILABLE"
    | "INTERNAL_ERROR";
  publicMessage: string;
  retryable: boolean;
  cause?: unknown;
}
```

`publicMessage` entra no SVG e `cause` permanece restrito aos logs seguros.

---

## Provider do GitHub

O provider encapsula a API externa e expõe operações orientadas ao domínio:

```ts
export interface ProjectProvider {
  getUser(username: string): Promise<UserSummary>;
  listRepositories(
    username: string,
    options: RepositoryQuery
  ): Promise<RepositorySummary[]>;
  getRepository(
    username: string,
    repository: string
  ): Promise<RepositorySummary>;
  getLatestCommit(
    repository: RepositorySummary,
    branch?: string
  ): Promise<CommitSummary | null>;
}
```

O restante do projeto não conhece:

- endpoints REST;
- headers específicos;
- paginação do GitHub;
- formatos de data externos;
- nomes de campos em `snake_case`;
- token;
- resposta de rate limit;
- códigos de erro específicos do provedor.

### Normalização

A normalização ocorre imediatamente após a resposta HTTP.

- `null` externo permanece explícito;
- Datas válidas viram `Date`;
- Strings recebem limite defensivo;
- URLs passam por validação de protocolo e domínio;
- Flags booleanas recebem valor definido;
- Campos desconhecidos não atravessam a fronteira;
- Mensagens de erro externas não entram diretamente no card.

---

## Seleção de dados

### Now Building

1. Carregar repositórios visíveis do usuário;
2. Remover itens excluídos;
3. Remover arquivados por padrão;
4. Remover forks por padrão;
5. Remover repositórios sem atividade conhecida;
6. Ordenar por `pushedAt` decrescente;
7. Usar o primeiro repositório elegível;
8. Consultar o commit mais recente somente para o repositório selecionado.

Quando `repository` está presente:

1. Validar proprietário e nome;
2. Buscar o repositório;
3. Aplicar regras de visibilidade e exclusão;
4. Consultar o commit mais recente;
5. Gerar o modelo visual.

### Project Radar

O radar usa metadados de repositório e o nível de atividade parte de `pushedAt`:

| Dias desde o último push | Nível | Peso visual |
|---:|---:|---|
| 0 a 1 | 5 | máximo |
| 2 a 7 | 4 | alto |
| 8 a 30 | 3 | médio |
| 31 a 90 | 2 | baixo |
| acima de 90 | 1 | mínimo |
| sem data | 0 | excluído por padrão |

A ordenação por atividade define quais projetos entram no limite, não a posição final de cada ponto.

---

## Renderização SVG

### O SVG contém:

- Elemento raiz com `xmlns`;
- `viewBox`;
- Largura e altura;
- Título acessível;
- Descrição acessível;
- Estilos internos estritamente visuais;
- Formas, grupos e textos;
- Nenhuma dependência obrigatória externa.

### Os renderers não usam:

- `<script>`;
- Atributos `onload`, `onclick` ou qualquer `on*`;
- `<foreignObject>`;
- HTML embutido;
- URLs arbitrárias;
- CSS importado;
- Fontes carregadas de domínio externo;
- Conteúdo bruto vindo de query string;
- XML sem escape.

### Os caracteres abaixo recebem escape em qualquer texto:

| Caractere | Saída |
|---|---|
| `&` | `&amp;` |
| `<` | `&lt;` |
| `>` | `&gt;` |
| `"` | `&quot;` |
| `'` | `&apos;` |

A função de escape trabalha sobre string normalizada e não aceita marcação confiável por convenção.

### Texto longo

O truncamento considera limite visual e não apenas quantidade de caracteres.

Estimativa por categorias:

- Caracteres estreitos;
- Caracteres médios;
- Caracteres largos;
- Espaços;
- Símbolos.

O renderer aplica elipse quando o texto ultrapassa a largura disponível.

| Campo | Limite defensivo |
|---|---:|
| Usuário | 39 caracteres |
| Repositório | 100 caracteres |
| Descrição | 160 caracteres antes do ajuste visual |
| Commit | 120 caracteres antes do ajuste visual |
| Linguagem | 32 caracteres |
| Rótulo de radar | 28 caracteres |

### Coordenadas

Cada card define um sistema de layout centralizado com constantes nomeadas. Isso evita valores mágicos espalhados no template, melhorando manutenibilidade e consistência.

Exemplo:

```ts
const layout = {
  padding: 24,
  headerHeight: 42,
  contentGap: 16,
  footerHeight: 30,
};
```

---

## Temas

### Modelo

```ts
export interface Theme {
  name: string;
  colors: {
    background: string;
    surface: string;
    foreground: string;
    muted: string;
    accent: string;
    border: string;
    success: string;
    warning: string;
    danger: string;
  };
}
```

### Resolução

A resolução segue:

1. Localizar tema solicitado;
2. Usar `github-dark` quando o nome não existe;
3. Validar sobrescritas de cor;
4. Aplicar somente sobrescritas válidas;
5. Verificar contraste mínimo de pares críticos;
6. Produzir tema imutável.

A validação de cor aceita:

```regex
^[0-9A-Fa-f]{6}$
```

O caractere `#` não entra na query string e é adicionado internamente.

### Contraste

Texto principal e fundo mantêm contraste suficiente para leitura. Quando uma sobrescrita personalizada produz contraste inadequado, o normalizador preserva o valor do tema no campo afetado.

---

## Validação

### Parâmetros comuns

- `username`: obrigatório, normalizado e validado;
- `theme`: enumeração;
- `locale`: lista permitida;
- `width`: inteiro limitado;
- booleanos: `true`, `false`, `1` e `0`;
- cores: hexadecimal de seis posições;
- listas: separadas por vírgula, sem itens vazios e com limite;
- nomes de repositório: caracteres compatíveis com o GitHub;
- números: sem `NaN`, infinito ou notação inesperada.

### Limites

| Entrada | Mínimo | Máximo |
|---|---:|---:|
| largura | 320 | 1200 |
| limite do radar | 1 | 12 |
| exclusões | 0 | 25 |
| tamanho de item em lista | 1 | 100 |
| query string considerada | 0 | 4096 bytes |

Valores fora dos limites resultam em fallback controlado ou `INVALID_REQUEST`.

---

## Cache

### Cache de dados

Armazena modelos normalizados do provider:

```text
github:user:<username>
github:repos:<username>:<filtros>
github:repo:<owner>/<repo>
github:commit:<owner>/<repo>:<branch>
```

TTL por categoria:

| Dado | TTL |
|---|---:|
| usuário | 1 hora |
| lista de repositórios | 5 minutos |
| repositório | 10 minutos |
| commit mais recente | 2 minutos |

O cache nunca armazena token na chave ou no valor.

### Cache HTTP

A resposta do card usa:

```http
Cache-Control: public, max-age=60, s-maxage=300, stale-while-revalidate=600
```

Significado:

- Navegador reutiliza por até 60 segundos;
- CDN reutiliza por até 300 segundos;
- Conteúdo anterior permanece disponível durante revalidação por até 600 segundos.

O valor fica configurável por ambiente.

### Chave do card

A chave inclui:

- Nome do card;
- Versão do contrato;
- Parâmetros normalizados;
- Identidade do provider;
- Versão do tema;
- Locale.

A ordem original da query string não altera a chave.

---

## Tratamento de erros

### Categorias públicas

| Código | Mensagem resumida | Repetição |
|---|---|---|
| `INVALID_REQUEST` | Parâmetros inválidos | após correção |
| `NOT_FOUND` | Usuário ou projeto não encontrado | não |
| `NO_DATA` | Nenhum projeto elegível | após nova atividade |
| `RATE_LIMITED` | Limite temporário do provedor | sim |
| `PROVIDER_UNAVAILABLE` | Serviço externo indisponível | sim |
| `INTERNAL_ERROR` | Não foi possível gerar o card | sim |

### Card de erro

- Usa dimensões fixas seguras;
- Exibe título curto;
- Exibe mensagem pública;
- Não imprime stack trace;
- Não imprime URL completa da requisição;
- Não imprime resposta crua do GitHub;
- Não imprime variáveis de ambiente;
- Inclui identificador opaco de correlação quando disponível.

### Status HTTP

Para maximizar compatibilidade com proxies de imagem, o endpoint pode devolver SVG de erro com status `200` para falhas de dados esperadas e cabeçalho de diagnóstico não sensível.

A política adotada distingue:

- Falha de validação: `400`;
- Método não permitido: `405`;
- SVG de ausência de dados: `200`;
- Indisponibilidade temporária representada como imagem: `200`;
- Erro inesperado representado como imagem: `500`.

A integração do GitHub pode exibir a imagem de erro mesmo quando o status não é `200`, mas proxies externos variam e testes de compatibilidade registram o comportamento antes de alterar essa política.

---

## Segurança

### Ameaças consideradas

- Injeção de XML/SVG;
- CSS malicioso;
- Quebra de atributos;
- URLs arbitrárias;
- Exposição de token;
- Abuso de dimensões;
- Listas excessivas;
- Consumo indevido da API;
- Logs com informações sensíveis;
- Mensagens externas refletidas;
- Cache poisoning por parâmetros não normalizados.

### Controles

- Escape XML obrigatório;
- Whitelist de enumerações;
- Regex estrita para cores;
- Limites numéricos;
- Limite total da query;
- Token somente em variável de ambiente;
- Timeout em chamadas externas;
- Cancelamento por `AbortSignal`;
- User-Agent identificável;
- Logs estruturados;
- Remoção de cabeçalhos sensíveis;
- Chaves de cache normalizadas;
- Ausência de scripts;
- Ausência de `foreignObject`;
- `X-Content-Type-Options: nosniff`.

---

## Observabilidade

Cada requisição registra sem conteúdo sensível:

```json
{
  "event": "card.render",
  "card": "now-building",
  "provider": "github",
  "username": "hash-ou-valor-sanitizado",
  "cache": "hit",
  "durationMs": 42,
  "status": "success",
  "degraded": false,
  "requestId": "..."
}
```

Eventos principais:

- `card.request`;
- `card.render`;
- `card.error`;
- `provider.request`;
- `provider.error`;
- `cache.hit`;
- `cache.miss`;
- `cache.write`.

O token, autorização, resposta crua e stack trace não entram em logs públicos. Stack trace permanece restrito ao ambiente de desenvolvimento ou observabilidade protegida.

---

## Testes

### Unitários

- Validação;
- Normalização;
- Cálculo de nível de atividade;
- Hash e posição;
- Truncamento;
- Escape;
- Resolução de tema;
- Geração de chave de cache.

### Integração

- Provider com `fetch` mockado;
- Paginação;
- Rate limit;
- Timeout;
- Ausência de campos opcionais;
- Resposta malformada;
- Cache hit e miss.

### Contrato

- `Content-Type`;
- `Cache-Control`;
- Dimensões;
- Presença de `viewBox`;
- XML bem formado;
- Ausência de tags proibidas;
- Parâmetros conhecidos;
- Card de erro.

### Snapshot estrutural

Snapshots cobrem SVGs estáveis, mas não substituem asserções semânticas. Datas e identificadores entram por relógio e factories determinísticas.

---

## Extensão por novos cards

Um novo card adiciona:

```text
src/cards/<nome>/
├── index.ts
├── model.ts
├── select.ts ou score.ts
└── render.ts

netlify/functions/<nome>.ts
tests/unit/cards/<nome>/
tests/contract/<nome>.test.ts
```

O novo módulo:

1. Declara parâmetros;
2. Valida entrada específica;
3. Usa modelos do provider;
4. Cria modelo visual próprio;
5. Usa primitivas do núcleo;
6. Registra rota pública;
7. Documenta exemplos;
8. Inclui testes de sucesso, vazio e erro.

O card não duplica cliente HTTP, temas, escape ou cabeçalhos.

---

## Extensão por novos provedores

A interface `ProjectProvider` permite adicionar outra fonte sem alterar renderers.

Exemplos de possíveis provedores compatíveis com o domínio:

- GitLab;
- API própria de portfólio;
- arquivo JSON controlado;
- serviço de status de deploy.

Um provider novo implementa os mesmos modelos normalizados. Funcionalidades exclusivas ficam atrás de capacidades explícitas sem adicionar campos opcionais aleatórios ao contrato principal.

---

## Critério de estabilidade arquitetural

A arquitetura preserva:

- Contratos internos tipados;
- Ausência de dependência externa nos renderers;
- Provider substituível;
- Resposta SVG segura;
- Parâmetros normalizados;
- Rota pública estável;
- Testes de contrato;
- Erro visual consistente;
- Cache observável;
- Documentação sincronizada.