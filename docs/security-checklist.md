# Security Checklist
Studio OS — antes de qualquer dado real entrar em produção

```
AUTENTICAÇÃO
☐ Login sem senha (magic-link/OTP) para staff e portal — decisão confirmada
☐ Sessão de banco (não JWT stateless) — revogável server-side
☐ Cookie httpOnly + secure + sameSite=lax
☐ "Sair de todos os dispositivos" implementado
☐ Rate limit em rotas de login/OTP

AUTORIZAÇÃO
☐ Nenhum organizationId aceito diretamente do cliente em nenhuma Server Action
☐ requireAuth() + requirePolicy() em 100% das Server Actions mutantes
☐ Teste de stress de multi-tenancy — organização A nunca lê/escreve dado de B
☐ Tentativas negadas geram AuditLog, não só as bem-sucedidas

DADOS
☐ RLS habilitado no Postgres como segunda camada (não só tenantDb)
☐ Payload de AuditLog mascarando PII (nunca duplicando dado sensível em texto puro)
☐ URLs de storage privado assinadas, TTL curto
☐ HTTPS obrigatório em todo ambiente (dev incluso, via túnel se necessário)

CÓDIGO
☐ Nenhuma query SQL concatenada manualmente em nenhum lugar (só Prisma)
☐ dangerouslySetInnerHTML nunca usado para snapshot de texto (Orçamento, Transaction)
☐ Zod validando 100% das entradas de Server Action
☐ Dependências auditadas automaticamente em CI

INFRAESTRUTURA
☐ Secrets nunca commitados, rotação documentada
☐ Backup diário confirmado ativo antes do primeiro dado real
☐ PITR avaliado/habilitado antes do primeiro dado real
☐ Ambientes dev/stage/production com credenciais isoladas
```

Este checklist deriva diretamente da seção 9 do ITS — nenhum item aqui é novo em
relação ao que já foi decidido, é a versão operacionalizável em formato de
verificação.
