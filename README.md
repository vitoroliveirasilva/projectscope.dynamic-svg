# ProjectScope Dynamic SVG

**SVGs dinâmicos para transformar dados de projetos e atividade de desenvolvimento em visualizações incorporáveis**

<div align="center">

[![Netlify Status](https://api.netlify.com/api/v1/badges/93804600-abc3-4caa-9953-a417c8648ae3/deploy-status)](https://app.netlify.com/projects/projectscope-dynamic-svg/deploys)
![Node.js](https://img.shields.io/badge/Node.js-24-339933?logo=node.js&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-6-3178C6?logo=typescript&logoColor=white)
![Netlify Functions](https://img.shields.io/badge/Netlify-Functions-00C7B7?logo=netlify&logoColor=white)
![Dynamic SVG](https://img.shields.io/badge/Dynamic-SVG-FFB13B?logo=svg&logoColor=white)

</div>

- [Visão geral](#visão-geral)
- [Cards](#cards)
- [Arquitetura](#arquitetura)
- [Uso](#uso)
- [Desenvolvimento](#desenvolvimento)
- [Documentação](#documentação)

---

## Visão geral

O **ProjectScope Dynamic SVG** é uma coleção de cards SVG gerados dinamicamente a partir de dados de projetos e atividade de desenvolvimento.

Cada card funciona como uma imagem acessível por URL. Dessa forma, essa abordagem permite incorporar as visualizações em diferentes superfícies sem depender de JavaScript no local de exibição:

- perfis e READMEs do GitHub;
- portfólios pessoais;
- páginas HTML;
- documentações técnicas;
- blogs;
- dashboards;
- páginas de apresentação de projetos;
- qualquer ambiente compatível com imagens externas ou SVGs.

O repositório concentra cards em uma única base técnica. Sendo assim, a integração com provedores, o cache, os temas, a validação de parâmetros, a sanitização de conteúdo e a resposta HTTP permanecem compartilhados e cada card mantém apenas suas regras de seleção de dados e composição visual.

1. **Now Building**, apresenta o projeto mais recentemente ativo ou um repositório escolhido explicitamente;
2. **Project Radar**, distribui os projetos mais relevantes em uma visualização orbital baseada em atividade recente.

---

## Objetivos

O ProjectScope mantém os seguintes objetivos:

- oferecer cards visualmente consistentes e fáceis de incorporar;
- representar atividade real sem afirmar dados que o provedor não entrega;
- compartilhar um núcleo seguro entre todos os cards;
- preservar URLs e parâmetros previsíveis;
- reduzir chamadas externas com cache;
- retornar um SVG válido mesmo quando uma integração falha;
- permitir expansão por novos cards, temas, idiomas e provedores;
- manter cada visualização independente da página em que aparece;
- priorizar legibilidade, acessibilidade e compatibilidade.

---

## Princípios do projeto

### Dados reais, significado explícito

O GitHub não informa qual projeto está aberto no editor nem confirma uma sessão ativa de programação. Por isso, o card **Now Building** interpreta “em desenvolvimento” como “repositório elegível com atividade mais recente”, salvo quando a URL informa um repositório específico.

Essa regra aparece na documentação e evita transformar uma aproximação técnica em uma afirmação enganosa.

### Uma plataforma pequena, não vários projetos repetidos

Todos os cards compartilham:

- cliente da API do GitHub;
- normalização de dados;
- cache;
- temas;
- tipografia;
- utilitários de SVG;
- validação de parâmetros;
- sanitização de textos;
- respostas de erro;
- cabeçalhos HTTP;
- observabilidade;
- testes de contrato.

### Segurança por padrão

Todo valor recebido por query string ou API externa é tratado como entrada não confiável, ou seja, textos entram no SVG somente após escape XML e limites de tamanho (cores, dimensões, enumerações e listas passam por validação explícita).

---

## Cards

### Now Building

O **Now Building** apresenta o projeto em destaque no momento. Desse modo, quando o parâmetro `repository` não está presente, o card seleciona o repositório elegível com atividade mais recente. Quando `repository` está presente, o card usa o repositório indicado desde que ele pertença ao usuário consultado e seja visível para a integração.

Informações principais:

- Nome do repositório;
- Descrição resumida;
- Linguagem principal;
- Branch padrão ou branch consultada;
- Mensagem do commit mais recente;
- Momento da última atividade;
- Estado visual de atividade;
- Link lógico do projeto nos metadados disponíveis.

Exemplo conceitual:

```text
┌──────────────────────────────────────────────────────────┐
│ NOW BUILDING                                             │
│                                                          │
│ sourcewise.dotnet-api                                    │
│ Add repository-level quality gates                       │
│                                                          │
│ C#  •  dev  •  atualizado recentemente                   │
└──────────────────────────────────────────────────────────┘
```

<hr>

### Project Radar

O **Project Radar** apresenta vários repositórios em uma visualização orbital. Sendo assim, cada projeto recebe posição estável, intensidade e destaque com base em regras determinísticas. A atividade recente influencia o peso visual enquanto um hash do nome do repositório mantém a posição consistente entre requisições.

Informações principais:

- Projetos elegíveis;
- Nível relativo de atividade;
- Linguagem principal;
- Rótulo do repositório;
- Quantidade máxima configurável;
- Filtros para forks, arquivados e exclusões explícitas.

Exemplo conceitual:

```text
                         sourcewise
                             ●

              epub-repair          projectscope
                   ●                    ●

                         mhs-pricing
                              ○
```

A especificação completa de comportamento, parâmetros e estados está em [`docs/CARDS.md`](docs/CARDS.md).

---

## Interface HTTP

```text
/api/cards/now-building.svg
/api/cards/project-radar.svg
```

### Parâmetros comuns

| Parâmetro | Tipo | Padrão | Descrição |
|---|---:|---:|---|
| `username` | string | obrigatório | Usuário do provedor consultado |
| `theme` | enum | `github-dark` | Tema visual aplicado ao card |
| `locale` | enum | `pt-BR` | Idioma de rótulos e datas relativas |
| `width` | inteiro | definido pelo card | Largura dentro dos limites aceitos |
| `hide_border` | boolean | `false` | Remove a borda externa quando verdadeiro |
| `background` | cor hexadecimal | tema | Sobrescreve a cor de fundo |
| `foreground` | cor hexadecimal | tema | Sobrescreve a cor principal de texto |
| `accent` | cor hexadecimal | tema | Sobrescreve a cor de destaque |
| `border` | cor hexadecimal | tema | Sobrescreve a cor da borda |

Cores personalizadas usam seis caracteres hexadecimais sem `#`:

```text
accent=3776AB
```

Valores inválidos não entram diretamente no SVG. Sendo assim, o normalizador aplica o padrão seguro do tema ou retorna um card de erro conforme a natureza do parâmetro.

---

## Exemplos de uso

Os cards podem ser testados localmente durante o desenvolvimento e a incorporação em READMEs, portfólios e páginas públicas depende de um deploy acessível pela internet.

### Ambiente local

Com o ambiente de desenvolvimento em execução, os endpoints ficam disponíveis em:

```text
http://localhost:8888/api/cards/now-building.svg?username=vitoroliveirasilva
```

```text
http://localhost:8888/api/cards/project-radar.svg?username=vitoroliveirasilva&limit=6
```

### Markdown após o deploy

Depois da publicação, o `<DOMINIO_DO_DEPLOY>` será substituido pelo domínio fornecido pelo serviço de hospedagem.

```md
![Projeto em desenvolvimento](https://<DOMINIO_DO_DEPLOY>/api/cards/now-building.svg?username=vitoroliveirasilva)
```

```md
![Radar de projetos](https://<DOMINIO_DO_DEPLOY>/api/cards/project-radar.svg?username=vitoroliveirasilva&limit=6)
```

### HTML após o deploy

```html
<img
  src="https://<DOMINIO_DO_DEPLOY>/api/cards/now-building.svg?username=vitoroliveirasilva&theme=github-dark"
  alt="Projeto em desenvolvimento de Vitor Oliveira Silva"
/>
```

```html
<img
  src="https://<DOMINIO_DO_DEPLOY>/api/cards/project-radar.svg?username=vitoroliveirasilva&limit=6"
  alt="Radar de projetos de Vitor Oliveira Silva"
/>
```

### Repositório específico

```md
![Projeto em destaque](https://<DOMINIO_DO_DEPLOY>/api/cards/now-building.svg?username=vitoroliveirasilva&repository=projectscope.dynamic-svg)
```

### Tema personalizado

```md
![Project Radar](https://<DOMINIO_DO_DEPLOY>/api/cards/project-radar.svg?username=vitoroliveirasilva&background=0D1117&foreground=FFFFFF&accent=3776AB&border=30363D)
```

---

## Temas

Os temas iniciais compartilham a mesma estrutura de tokens:

- `background`;
- `surface`;
- `foreground`;
- `muted`;
- `accent`;
- `border`;
- `success`;
- `warning`;
- `danger`.

Temas definidos no núcleo:

| Tema | Uso |
|---|---|
| `github-dark` | Integração natural com interfaces escuras do GitHub |
| `github-light` | Integração natural com interfaces claras |
| `midnight` | Fundo profundo e contraste acentuado |
| `transparent` | Fundo transparente com conteúdo adaptado para incorporação |

O tema `transparent` exige atenção especial à legibilidade, pois a página hospedeira controla o fundo real.

---

## Arquitetura

```text
projectscope.dynamic-svg/
├── docs/
│   ├── ARCHITECTURE.md
│   ├── CARDS.md
│   └── DEVELOPMENT.md
├── examples/
│   ├── now-building.md
│   └── project-radar.md
├── netlify/
│   └── functions/
│       ├── now-building.ts
│       └── project-radar.ts
├── src/
│   ├── cards/
│   │   ├── now-building/
│   │   │   ├── index.ts
│   │   │   ├── model.ts
│   │   │   ├── select.ts
│   │   │   └── render.ts
│   │   └── project-radar/
│   │       ├── index.ts
│   │       ├── model.ts
│   │       ├── score.ts
│   │       └── render.ts
│   ├── core/
│   │   ├── cache/
│   │   ├── errors/
│   │   ├── http/
│   │   ├── render/
│   │   ├── themes/
│   │   └── validation/
│   ├── providers/
│   │   └── github/
│   └── shared/
├── tests/
│   ├── contract/
│   ├── integration/
│   ├── unit/
│   └── snapshots/
├── .env.example
├── netlify.toml
├── package.json
├── tsconfig.json
└── README.md
```

Os detalhes de responsabilidades, fluxos e fronteiras estão em [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md).

---

## Configuração

Variáveis de ambiente:

| Variável | Obrigatória | Conteúdo |
|---|---:|---|
| `GITHUB_TOKEN` | sim | Token usado somente no servidor para ampliar limites e acessar dados permitidos |
| `GITHUB_API_BASE_URL` | não | Base da API, útil para testes e ambientes controlados |
| `CACHE_TTL_SECONDS` | não | Tempo padrão de cache dos dados normalizados |
| `CARD_CACHE_CONTROL` | não | Valor completo do cabeçalho `Cache-Control` |
| `LOG_LEVEL` | não | Nível de logs estruturados |
| `NODE_ENV` | não | Ambiente de execução |

O `GITHUB_TOKEN` nunca aparece em parâmetros de URL, corpo do SVG, mensagens de erro ou logs.

Exemplo de `.env`:

```env
GITHUB_TOKEN=github_pat_xxxxxxxxxxxxxxxxx
GITHUB_API_BASE_URL=https://api.github.com
CACHE_TTL_SECONDS=300
CARD_CACHE_CONTROL=public, max-age=60, s-maxage=300, stale-while-revalidate=600
LOG_LEVEL=info
NODE_ENV=development
```

---

## Resposta HTTP

Uma resposta bem-sucedida usa:

```http
Content-Type: image/svg+xml; charset=utf-8
Cache-Control: public, max-age=60, s-maxage=300, stale-while-revalidate=600
X-Content-Type-Options: nosniff
```

O corpo contém um SVG autossuficiente, sem scripts, manipuladores de evento ou conteúdo HTML por `foreignObject`.

Falhas previsíveis também retornam um SVG legível para evitar ícones quebrados em páginas externas e manter a mensagem de erro no mesmo formato da integração.

Exemplos de falhas tratadas:

- Usuário ausente;
- Usuário inválido;
- Repositório inexistente;
- Limite da API atingido;
- Provedor indisponível;
- Parâmetros fora dos limites;
- Ausência de projetos elegíveis;
- Erro interno inesperado.

O card de erro não expõe tokens, stack traces, cabeçalhos sensíveis nem detalhes internos do provedor.

---

## Desenvolvimento

### Instalação e execução local

Instale as dependências do projeto:

```bash
npm install
```

Inicie o ambiente local com as Netlify Functions:

```bash
npm run dev
```

### Validação completa

Execute todas as verificações de qualidade com um único comando:

```bash
npm run check
```

Esse comando executa, em sequência:

- Verificação de tipos com TypeScript;
- Análise estática do código;
- Verificação de formatação;
- Testes automatizados;
- Build de produção.

### Comandos individuais

As verificações também podem ser executadas separadamente:

```bash
npm run typecheck
npm run lint
npm run format:check
npm test
npm run build
```

Para aplicar automaticamente a formatação configurada no projeto:

```bash
npm run format
```

O guia completo de ambiente, branches, commits, testes e critérios de conclusão está em [`docs/DEVELOPMENT.md`](docs/DEVELOPMENT.md).

---

## Documentação

| Documento | Conteúdo |
|---|---|
| [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) | Componentes, dependências, fluxo de dados, segurança, cache e observabilidade |
| [`docs/CARDS.md`](docs/CARDS.md) | Contrato dos cards, parâmetros, regras de seleção, layout e estados |
| [`docs/DEVELOPMENT.md`](docs/DEVELOPMENT.md) | Ambiente local, scripts, branches, testes, commits, releases e sequência de implementação |