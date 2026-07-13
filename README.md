# ProjectScope Dynamic SVG

**Cards SVG dinâmicos para apresentar projetos e atividade de desenvolvimento**

<div align="center">

[![Netlify Status](https://api.netlify.com/api/v1/badges/93804600-abc3-4caa-9953-a417c8648ae3/deploy-status)](https://app.netlify.com/projects/projectscope-dynamic-svg/deploys)
[![CI](https://github.com/vitoroliveirasilva/projectscope.dynamic-svg/actions/workflows/ci.yml/badge.svg?branch=prod)](https://github.com/vitoroliveirasilva/projectscope.dynamic-svg/actions/workflows/ci.yml)
![Version](https://img.shields.io/badge/version-1.0.0-3776AB)
![Node.js](https://img.shields.io/badge/Node.js-24-339933?logo=node.js&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-6-3178C6?logo=typescript&logoColor=white)
![Netlify Functions](https://img.shields.io/badge/Netlify-Functions-00C7B7?logo=netlify&logoColor=white)

</div>

- [Produção](https://projectscope-dynamic-svg.netlify.app)
- [Cards](#cards)
- [Uso](#uso)
- [Desenvolvimento](#desenvolvimento)
- [Documentação](#documentação)

---

## Visão geral

O **ProjectScope Dynamic SVG** transforma dados reais do GitHub em imagens SVG seguras e incorporáveis. Os cards funcionam por URL e não exigem JavaScript no README, portfólio ou página que os exibe.

A versão `1.0.0` inclui dois cards:

- **Now Building**, para destacar o repositório com atividade mais recente ou um projeto escolhido explicitamente;
- **Project Radar**, para representar projetos ativos em uma visualização orbital determinística.

O projeto usa TypeScript, Node.js, Netlify Functions, GitHub REST API, cache em memória, validação de parâmetros, temas compartilhados e testes de contrato.

## Cards

### Now Building

[![Now Building](https://projectscope-dynamic-svg.netlify.app/api/cards/now-building.svg?username=vitoroliveirasilva)](https://projectscope-dynamic-svg.netlify.app/api/cards/now-building.svg?username=vitoroliveirasilva)

Exibe:

- Nome e descrição do repositório;
- Linguagem principal;
- Branch consultada;
- Primeiro título do commit mais recente;
- Atualização relativa;
- Estado visual de atividade;
- Layout normal ou compacto.

O GitHub não informa qual projeto está aberto no editor. Por isso, "Now Building" significa o repositório elegível com atividade mais recente, salvo quando `repository` é informado.

### Project Radar

[![Project Radar](https://projectscope-dynamic-svg.netlify.app/api/cards/project-radar.svg?username=vitoroliveirasilva&limit=6)](https://projectscope-dynamic-svg.netlify.app/api/cards/project-radar.svg?username=vitoroliveirasilva&limit=6)

Exibe até 12 projetos em órbitas estáveis. O último push influencia tamanho, opacidade e destaque visual, enquanto um hash do nome completo preserva a posição entre requisições.

## Rotas públicas

```text
GET /api/health.svg
GET /api/cards/now-building.svg
GET /api/cards/project-radar.svg
```

Base de produção:

```text
https://projectscope-dynamic-svg.netlify.app
```

## Uso

### Now Building automático

```md
![Projeto em desenvolvimento](https://projectscope-dynamic-svg.netlify.app/api/cards/now-building.svg?username=vitoroliveirasilva)
```

### Repositório específico

```md
![Projeto em destaque](https://projectscope-dynamic-svg.netlify.app/api/cards/now-building.svg?username=vitoroliveirasilva&repository=projectscope.dynamic-svg)
```

### Modo compacto

```md
![Projeto em desenvolvimento](https://projectscope-dynamic-svg.netlify.app/api/cards/now-building.svg?username=vitoroliveirasilva&compact=true)
```

### Project Radar

```md
![Radar de projetos](https://projectscope-dynamic-svg.netlify.app/api/cards/project-radar.svg?username=vitoroliveirasilva&limit=6)
```

### Tema personalizado

```md
![Project Radar](https://projectscope-dynamic-svg.netlify.app/api/cards/project-radar.svg?username=vitoroliveirasilva&background=0D1117&foreground=FFFFFF&accent=3776AB&border=30363D)
```

Mais exemplos estão em [`examples/now-building.md`](examples/now-building.md) e [`examples/project-radar.md`](examples/project-radar.md).

## Parâmetros comuns

| Parâmetro | Padrão | Descrição |
|---|---|---|
| `username` | obrigatório | Usuário consultado no GitHub |
| `theme` | `github-dark` | `github-dark`, `github-light`, `midnight` ou `transparent` |
| `locale` | `pt-BR` | `pt-BR` ou `en-US` |
| `width` | por card | Largura dentro dos limites aceitos |
| `hide_border` | `false` | Remove a borda externa |
| `background` | tema | Cor hexadecimal sem `#` |
| `foreground` | tema | Cor hexadecimal sem `#` |
| `accent` | tema | Cor hexadecimal sem `#` |
| `border` | tema | Cor hexadecimal sem `#` |

O contrato completo de cada card está em [`docs/CARDS.md`](docs/CARDS.md).

## Segurança

Todo parâmetro e todo texto retornado pela API são tratados como entrada não confiável. Sendo assim, o projeto aplica:

- Escape XML;
- Remoção de caracteres de controle incompatíveis;
- Limites de tamanho e enumerações;
- Bloqueio de scripts, `foreignObject` e atributos executáveis;
- Validação da origem da API;
- Erros públicos sem tokens ou stack traces;
- Content Security Policy e headers de proteção;
- Cache separado por recurso e parâmetros relevantes.

Consulte [`SECURITY.md`](SECURITY.md) para reportar vulnerabilidades.

## Arquitetura

```text
Netlify Function
  → validação e tema
  → card
  → ProjectProvider
  → GitHub Provider
  → GitHub REST API
  → modelo interno
  → renderer SVG
  → resposta HTTP segura
```

Responsabilidades e decisões detalhadas estão em [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md).

## Configuração

Variáveis de ambiente:

| Variável | Obrigatória | Descrição |
|---|---:|---|
| `GITHUB_TOKEN` | não | Amplia o limite da API e permanece somente no servidor |
| `GITHUB_API_BASE_URL` | não | Base da API, padrão `https://api.github.com` |
| `CACHE_TTL_SECONDS` | não | TTL padrão dos dados normalizados |
| `CARD_CACHE_CONTROL` | não | Valor do header `Cache-Control` |
| `LOG_LEVEL` | não | `debug`, `info`, `warn` ou `error` |
| `NODE_ENV` | não | `development`, `test` ou `production` |

Exemplo local:

```env
GITHUB_TOKEN=
GITHUB_API_BASE_URL=https://api.github.com
CACHE_TTL_SECONDS=300
CARD_CACHE_CONTROL=public, max-age=60, s-maxage=300, stale-while-revalidate=600
LOG_LEVEL=info
NODE_ENV=development
```

## Desenvolvimento

Requisitos:

- Node.js 24;
- npm 11.

Instalação:

```bash
npm ci
```

Ambiente local:

```bash
npm run dev
```

Validação completa:

```bash
npm run check
```

Preparação de release:

```bash
npm run release:check
```

Verificação do deploy:

```bash
npm run verify:deploy -- \
  --base-url https://projectscope-dynamic-svg.netlify.app \
  --username vitoroliveirasilva
```

## Branches e contribuição

- `prod` representa produção e recebe mudanças somente por pull request;
- `dev` concentra o desenvolvimento integrado;
- CI e preview da Netlify precisam passar antes do merge.

Consulte [`CONTRIBUTING.md`](CONTRIBUTING.md).

## Documentação

| Documento | Conteúdo |
|---|---|
| [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) | Arquitetura, fluxo, cache, segurança e decisões |
| [`docs/CARDS.md`](docs/CARDS.md) | Contratos, parâmetros, seleção, layouts e erros |
| [`docs/DEVELOPMENT.md`](docs/DEVELOPMENT.md) | Ambiente, scripts, testes e critérios de conclusão |
| [`SECURITY.md`](SECURITY.md) | Política de segurança |