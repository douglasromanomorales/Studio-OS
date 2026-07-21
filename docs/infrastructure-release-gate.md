# Infrastructure Release Gate
Studio OS — critérios que precisam estar verdes antes da primeira linha de código da Fase 3.1

```
DOCUMENTAÇÃO
☑ Infrastructure Foundation Blueprint aprovado
☑ Infrastructure Technical Specification aprovada
☑ Infrastructure Risk Matrix aprovada
☑ Infrastructure Migration Plan aprovado
☑ Infrastructure Dependency Diagram produzido
☑ Request Lifecycle Diagram produzido
☑ Security Checklist produzido

DECISÕES CONFIRMADAS
☑ Estratégia de sessão: banco, não JWT
☑ Estratégia de login: magic-link/OTP, sem senha
☑ correlationId (domínio) e requestId/traceId (infraestrutura) desambiguados
☑ Soft delete permanece específico por domínio, sem campo genérico
☑ Nenhuma mudança de assinatura em Application Service já construído

AMBIENTE (a confirmar antes do código, não depois)
☐ Projeto Supabase de desenvolvimento criado e acessível
☐ Variáveis de ambiente documentadas com schema de validação
☐ CI configurado para bloquear merge sem lint+typecheck+teste

COMPATIBILIDADE COM PRINCÍPIOS EXISTENTES
☑ DDD / Domain Pipeline — domínio permanece intocado
☑ Single Owner Principle — AuditLog não duplica o ledger financeiro
☑ Derived Over Stored — nenhuma nova coluna derivada introduzida
☑ Snapshot Principle — snapshots existentes inalterados
☑ Temporal Truth — reforçado (ADL-106)
☑ Platform Discovery — Permission/Tracing/Feature-flag-service adiados por falta de evidência
```

**Status:** 15 de 18 itens verdes por decisão de documentação/arquitetura. Os 3
itens de ambiente ("a confirmar antes do código") são operacionais, não de
design — dependem de acesso a infraestrutura real (criar o projeto Supabase,
configurar CI), não de mais nenhuma decisão arquitetural.

**A Fase 3.1 pode começar assim que os 3 itens de ambiente forem confirmados.**
Nenhum bloqueador de arquitetura permanece.
