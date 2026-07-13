# Política de segurança

## Como reportar uma vulnerabilidade

Use **Security > Report a vulnerability** no GitHub para enviar um aviso privado. Quando esse recurso não estiver disponível, entre em contato de forma privada com o mantenedor pelo perfil `@vitoroliveirasilva`.

Não publique em issues:

- Tokens ou credenciais;
- URLs assinadas;
- Dados privados;
- Passos completos de exploração;
- Respostas contendo informações sensíveis.

Inclua no relato privado:

- Componente e rota afetados;
- Impacto esperado;
- Passos mínimos para reprodução;
- Versão ou commit;
- Evidências sanitizadas;
- Sugestão de correção, quando houver.

## Escopo de segurança

São especialmente relevantes:

- Injeção em SVG ou XML;
- Exposição do `GITHUB_TOKEN`;
- Bypass de validação de parâmetros;
- SSRF ou alteração indevida da origem da API;
- Vazamento por logs ou mensagens de erro;
- Cache compartilhado entre chaves incompatíveis;
- Headers que permitam execução de conteúdo ativo.