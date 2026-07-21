Os primitivos de UI vivem em `src/design-system` (antes um pacote workspace
separado, `@codechain/ui` — incorporado ao projeto para eliminar a dependência
de monorepo). Patterns específicos do domínio do Studio OS (que conhecem enums
e conceitos de negócio) continuam aqui, nunca dentro de `design-system`.
