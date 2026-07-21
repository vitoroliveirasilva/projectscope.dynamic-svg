# @vitoroliveirasilva/projectscope-svg-core

Núcleo TypeScript reutilizável do ProjectScope para produzir SVG seguro, tratar textos e resolver temas com contraste defensivo.

## Recursos

- Escape XML e remoção de caracteres incompatíveis;
- Documento SVG acessível com `title` e `desc`;
- Estimativa e truncamento determinístico de texto;
- Temas `github-dark`, `github-light`, `midnight` e `transparent`;
- Sobrescritas de cores com normalização;
- Cálculo de contraste e fallback de legibilidade;
- Tipos TypeScript e source maps.

## Autenticação no GitHub Packages

O GitHub Packages exige autenticação inclusive para pacotes públicos. Crie um personal access token classic somente com `read:packages` e configure o arquivo `~/.npmrc` do usuário:

```ini
@vitoroliveirasilva:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=SEU_TOKEN
always-auth=true
```

Não versione o token no projeto.

## Instalação

```bash
npm install @vitoroliveirasilva/projectscope-svg-core@1.0.0
```

## Uso

```ts
import {
  createSvgDocument,
  escapeXml,
  resolveTheme,
  truncateSvgText,
} from "@vitoroliveirasilva/projectscope-svg-core";

const theme = resolveTheme({ name: "github-dark" });
const title = truncateSvgText("ProjectScope Dynamic SVG", 220, 18);

const svg = createSvgDocument({
  width: 420,
  height: 120,
  title,
  description: "Card de exemplo",
  trustedContent: `<rect width="420" height="120" fill="${theme.colors.background}"/><text x="20" y="60" fill="${theme.colors.foreground}">${escapeXml(title)}</text>`,
});
```

`trustedContent` deve conter apenas marcação SVG produzida pela aplicação. Dados externos precisam passar por `escapeXml` antes de serem inseridos na marcação.

## API pública

### Renderização

- `createSvgDocument(options)`;
- `escapeXml(value)`;
- `sanitizeXmlText(value)`;
- `estimateTextWidth(value, fontSize)`;
- `truncateSvgText(value, maximumWidth, fontSize)`.

### Temas

- `resolveTheme(options)`;
- `contrastRatio(first, second)`;
- `THEME_NAMES`;
- `THEME_REGISTRY`;
- `DEFAULT_THEME_NAME`.

### Tipos

- `SvgDocumentOptions`;
- `ResolveThemeOptions`;
- `Theme`;
- `ThemeColors`;
- `ThemeColorOverrides`;
- `ThemeName`.

## Versionamento e publicação

O pacote possui versão independente da aplicação ProjectScope. Use tags de Release com este formato:

```text
svg-core-v1.0.0
svg-core-v1.0.1
svg-core-v1.1.0
```

Releases da aplicação, como `v1.1.0`, não publicam este pacote.

Antes de publicar uma nova versão:

1. altere `version` em `packages/svg-core/package.json`;
2. valide `npm run package:check` e `npm run release:check`;
3. faça merge em `prod`;
4. crie a Release `svg-core-vX.Y.Z` apontando para o commit da `prod`;
5. aguarde o workflow `Publish SVG core package`.

O workflow rejeita:

- tags sem o prefixo `svg-core-v`;
- versão diferente da declarada no pacote;
- publicação manual executada fora de `prod`;
- tag ou commit que ainda não esteja contido em `prod`;
- tentativa de republicar uma versão npm já existente.

Publique uma nova versão somente quando a API ou a implementação reutilizável do SVG core mudar. Alterações exclusivas na aplicação, nos cards ou no deploy da Netlify não exigem nova versão do Package.

## Compatibilidade

- Node.js 24;
- ESM;
- TypeScript 6;
- Navegadores e runtimes que consumam o JavaScript compilado pelo projeto cliente.

## Licença

MIT.
