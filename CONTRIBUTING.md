# Contribuindo com o ProjectScope Dynamic SVG

## Fluxo de branches

- `prod` contém a versão estável e publicada;
- `dev` concentra o desenvolvimento integrado;
- Alterações maiores podem usar branches curtas criadas a partir de `dev`;
- Mudanças em `prod` entram exclusivamente por pull request.

## Ambiente local

```bash
npm ci
npm run dev
```

Crie um arquivo `.env` local a partir de `.env.example` e nunca versione tokens.

## Qualidade obrigatória

Antes de enviar uma alteração:

```bash
npm run check
```

Para preparar uma versão estável:

```bash
npm run release:check
```

## Commits

Use mensagens em português no formato:

```text
TIPO - Descrição objetiva
```

Tipos principais:

- `FEAT` para funcionalidades;
- `FIX` para correções;
- `DOCS` para documentação;
- `REFACTOR` para mudanças internas;
- `TEST` para testes;
- `CHORE` para manutenção;
- `CI` para automação;
- `SECURITY` para proteção;
- `RELEASE` para preparação de versão.

## Pull requests

Uma PR para `prod` precisa:

- Partir de `dev`;
- Explicar escopo e impacto;
- Passar pelo check `Quality gate`;
- Estar atualizada com `prod`;
- Não incluir secrets ou respostas externas cruas.

## Compatibilidade

Alterações incompatíveis em rotas, parâmetros ou significado dos cards exigem:

- Documentação explícita;
- Testes de contrato;
- Versão principal nova conforme versionamento semântico.

## Segurança

Não abra uma issue pública com tokens, detalhes de exploração ou dados privados. Siga o processo descrito em [`SECURITY.md`](SECURITY.md).
