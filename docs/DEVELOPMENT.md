# Desenvolvimento

- Preparação do ambiente;
- Estrutura inicial;
- Scripts;
- Configuração;
- Branches;
- Commits;
- Testes;
- Qualidade;
- Depuração;
- Deploy;
- Sequência de implementação;
- Critérios de conclusão.

---

## Base técnica

- Node.js;
- TypeScript;
- npm;
- Netlify Functions;
- API REST do GitHub;
- Runner de testes compatível com TypeScript;
- Lint e formatação automatizados;
- GitHub Actions para integração contínua.
- `package.json`;
- Lockfile;
- Campo `engines`;
- Arquivo de versão de Node.js;
- Configuração da CI.

---

## Preparação local

### Clone

```bash
git clone https://github.com/vitoroliveirasilva/projectscope.dynamic-svg.git
cd projectscope.dynamic-svg
```

### Dependências

```bash
npm install
```

### Configuração de ambiente

```bash
cp .env.example .env
```

No Windows PowerShell:

```powershell
Copy-Item .env.example .env
```

Conteúdo mínimo:

```env
GITHUB_TOKEN=
GITHUB_API_BASE_URL=https://api.github.com
CACHE_TTL_SECONDS=300
CARD_CACHE_CONTROL=public, max-age=60, s-maxage=300, stale-while-revalidate=600
LOG_LEVEL=debug
NODE_ENV=development
```

O projeto funciona com dados públicos sem token enquanto o limite do provedor permite (o token local reduz falhas por limite e nunca entra no Git).

### Execução

```bash
npm run dev
```

O ambiente local disponibiliza as funções e redirects configurados na Netlify.

Exemplos:

```text
http://localhost:8888/api/cards/now-building.svg?username=vitoroliveirasilva
http://localhost:8888/api/cards/project-radar.svg?username=vitoroliveirasilva
```

---

## Scripts padronizados

O `package.json` expõe:

| Script | Responsabilidade |
|---|---|
| `dev` | Executa ambiente local com funções e redirects |
| `build` | Compila e valida a saída de produção |
| `typecheck` | Verifica TypeScript sem emitir arquivos |
| `lint` | Executa regras estáticas |
| `lint:fix` | Aplica correções seguras de lint |
| `format` | Formata arquivos |
| `format:check` | Valida formatação |
| `test` | Executa suíte completa |
| `test:unit` | Executa testes unitários |
| `test:integration` | Executa testes de integração |
| `test:contract` | Executa testes HTTP e SVG |
| `test:watch` | Executa testes em modo interativo |
| `coverage` | Gera relatório de cobertura |
| `check` | Agrega typecheck, lint, formato, testes e build |

Comando de validação completa:

```bash
npm run check
```

---

## Estrutura do repositório

```text
projectscope.dynamic-svg/
├── .github/
│   └── workflows/
│       └── ci.yml
├── docs/
│   ├── ARCHITECTURE.md
│   ├── CARDS.md
│   └── DEVELOPMENT.md
├── examples/
├── netlify/
│   └── functions/
├── src/
│   ├── cards/
│   ├── core/
│   ├── providers/
│   └── shared/
├── tests/
│   ├── contract/
│   ├── fixtures/
│   ├── integration/
│   ├── snapshots/
│   └── unit/
├── .editorconfig
├── .env.example
├── .gitignore
├── .nvmrc
├── netlify.toml
├── package-lock.json
├── package.json
├── tsconfig.json
└── README.md
```

---

## Configuração TypeScript

Princípios:

- Modo estrito;
- Sem `any` implícito;
- Sem retorno implícito em funções públicas importantes;
- Tipos de provider separados dos modelos externos;
- Imports consistentes;
- Testes incluídos na verificação;
- Código compilável sem depender de variáveis globais não declaradas.

Configuração conceitual:

```json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "noImplicitOverride": true,
    "useUnknownInCatchVariables": true,
    "forceConsistentCasingInFileNames": true,
    "skipLibCheck": true
  }
}
```

O alvo e o sistema de módulos acompanham o runtime definido no projeto.

---

## Variáveis de ambiente

### Leitura centralizada

Somente o módulo de configuração acessa `process.env`.

Exemplo de contrato:

```ts
export interface AppConfig {
  githubToken?: string;
  githubApiBaseUrl: string;
  cacheTtlSeconds: number;
  cardCacheControl: string;
  logLevel: "debug" | "info" | "warn" | "error";
  environment: "development" | "test" | "production";
}
```

### Validação

A configuração é validada no início da execução.

- URL base precisa usar protocolo permitido;
- TTL precisa ser inteiro positivo;
- `Cache-Control` não aceita quebra de linha;
- Nível de log usa enumeração;
- Token vazio vira `undefined`;
- Valores inválidos produzem erro claro no ambiente local;
- Resposta pública não revela conteúdo da variável.

---

## Branches

O repositório usa:

- `prod`: Branch estável e padrão;
- `dev`: Desenvolvimento;

Padrões:

```text
FEAT - Now-building-card
FEAT - Project-radar-card
FEAT - Github-provider
FIX - svg-text-overflow
DOCS - Card-contract
CHORE - Initial-tooling
TEST - Provider-rate-limit
```

---

## Commits

O projeto usa Conventional Commits, sendo esses os tipos principais:

```text
FEAT
FIX
DOCS
REFACT
TEST
CHORE
CI
BUILD
```

Exemplos:

```text
CHORE - Initialize TypeScript project
FEAT - Add GitHub repository provider
FEAT - Render now building card
FIX - Escape ampersands in repository descriptions
TEST - Cover project radar label collisions
DOCS - Document card query parameters
CI - Add repository quality checks
```

---

## Qualidade de código

- Dependências injetáveis;
- Nenhum `fetch` direto em renderer;
- Nenhum `process.env` fora da configuração;
- Nenhum texto externo sem escape;
- Nenhum valor visual sem constante ou modelo;
- Nenhum token em log;
- Nenhuma query string usada como chave sem normalização;
- Nenhum `catch` silencioso;
- Nenhum erro genérico quando existe categoria de domínio.

### Lint

O lint cobre:

- Promessas não tratadas;
- Imports inconsistentes;
- Variáveis não usadas;
- Uso inseguro de `any`;
- Condições redundantes;
- Padrões de erro;
- Escapes e templates quando aplicável.

---

## Testes

### Testes unitários

Cobrem funções puras:

- `escapeXml`;
- `truncateText`;
- `parseBoolean`;
- `parseColor`;
- `parseList`;
- `resolveTheme`;
- `activityLevel`;
- `stableHash`;
- `radarPosition`;
- Seleção do repositório;
- Normalização de mensagens;
- Chave de cache.

### Testes de integração

Usam provider real com transporte mockado.

Cenários:

- Usuário válido;
- Paginação de repositórios;
- Resposta sem descrição;
- Linguagem nula;
- Branch inexistente;
- Commit inexistente;
- Rate limit;
- Timeout;
- Erro 500;
- JSON inválido;
- Cache hit;
- Cache miss;
- Revalidação.

Nenhum teste automatizado chama a API externa real por padrão.

### Testes de contrato

Chamam o handler como consumidor HTTP.

```text
Status
Content-Type
Cache-Control
X-Content-Type-Options
SVG bem formado
ViewBox
Width
Height
Title
Desc
Ausência de script
Ausência de foreignObject
Ausência de atributos on*
Mensagem de erro segura
```

---

## Desenvolvimento de um card

### Contrato [`docs/CARDS.md`](docs/CARDS.md):

- Significado;
- Rota;
- Parâmetros;
- Defaults;
- Filtros;
- Estados;
- Dimensões;
- Acessibilidade;
- Erros.

### Modelo

Criar modelo visual sem SVG:

```ts
interface NowBuildingViewModel {
  title: string;
  repositoryName: string;
  description?: string;
  commit?: string;
  metadata: string[];
  activity: ActivityState;
  updatedLabel?: string;
}
```

### Seleção

Transforma dados normalizados em modelo visual e a seleção não conhece coordenadas SVG.

### Renderer

Transforma modelo visual e tema em string SVG (o renderer não chama provider nem lê ambiente).

### Handler

Conectar query, dependências, caso de uso e resposta.

### Testes

- Unidade da seleção;
- Unidade do renderer;
- Contrato do handler;
- Vazio;
- Erro;
- Texto longo;
- Temas.

---

## Desenvolvimento de um componente SVG

Primitivas compartilhadas ficam em `src/core/render`.

Exemplos:

- `svgDocument`;
- `roundedRect`;
- `text`;
- `badge`;
- `metadataRow`;
- `activityDot`;
- `errorPanel`.

Um componente compartilhado precisa:

- Atender mais de um card;
- Não conter nome de domínio específico;
- Receber valores já normalizados;
- Manter acessibilidade;
- Possuir testes.

Componentes usados por apenas um card permanecem no módulo do card.

---

## Integração contínua

A CI executa em pushes e pull requests relevantes.

```text
checkout
setup do Node.js
npm ci
npm run typecheck
npm run lint
npm run format:check
npm test
npm run build
```

---

## Netlify

### Redirects

`netlify.toml` mantém rotas públicas:

```toml
[[redirects]]
  from = "/api/cards/now-building.svg"
  to = "/.netlify/functions/now-building"
  status = 200

[[redirects]]
  from = "/api/cards/project-radar.svg"
  to = "/.netlify/functions/project-radar"
  status = 200
```

### Ambiente

### Preview

Deploy previews permitem validar:

- Temas;
- Dimensões;
- Textos longos;
- Estados vazios;
- Integração real com dados públicos;
- Headers;
- Cache.

---

## Manutenção da documentação

Atualizações obrigatórias:

| Mudança | Documento |
|---|---|
| Rota ou parâmetro | `README.md` e `docs/CARDS.md` |
| Componente ou dependência | `docs/ARCHITECTURE.md` |
| Script ou fluxo | `docs/DEVELOPMENT.md` |
| Novo card | Todos os documentos aplicáveis |
| Novo tema | `README.md` e especificação |
| Quebra de contrato | Especificação e notas de release |

A documentação faz parte do contrato, portanto, Texto desatualizado é tratado como defeito.