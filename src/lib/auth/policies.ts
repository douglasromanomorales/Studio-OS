export type StaffRole = "OWNER" | "ADMIN" | "RECEPTION" | "PROFESSIONAL" | "FINANCE";

export type Capability =
  | "clientes.gerenciar"
  | "profissionais.gerenciar"
  | "servicos.gerenciar"
  | "servicos.ver"
  | "agenda.gerenciar"
  | "agenda.ver_propria"
  | "consultas.gerenciar"
  | "orcamentos.aprovar"
  | "financeiro.gerenciar"
  | "financeiro.ver_propria_comissao"
  | "configuracoes.gerenciar";

/**
 * RBAC como constante em código, não tabela `Permission` (decisão já registrada
 * no ITS — sem evidência real de necessidade de granularidade abaixo de papel).
 * Policies são funções puras, mesma forma de Specification usada em todo domínio
 * de negócio — autorização é regra, só que sobre quem pode agir, não sobre o
 * que é verdade no domínio.
 */
const ROLE_CAPABILITIES: Record<StaffRole, Set<Capability>> = {
  OWNER: new Set([
    "clientes.gerenciar", "profissionais.gerenciar", "servicos.gerenciar", "servicos.ver",
    "agenda.gerenciar", "agenda.ver_propria", "consultas.gerenciar",
    "orcamentos.aprovar", "financeiro.gerenciar", "financeiro.ver_propria_comissao",
    "configuracoes.gerenciar",
  ]),
  ADMIN: new Set([
    "clientes.gerenciar", "profissionais.gerenciar", "servicos.gerenciar", "servicos.ver",
    "agenda.gerenciar", "agenda.ver_propria", "consultas.gerenciar",
    "orcamentos.aprovar", "financeiro.gerenciar", "financeiro.ver_propria_comissao",
  ]),
  RECEPTION: new Set([
    "clientes.gerenciar", "servicos.ver", "agenda.gerenciar", "agenda.ver_propria", "consultas.gerenciar",
  ]),
  PROFESSIONAL: new Set([
    "servicos.ver", "agenda.ver_propria", "consultas.gerenciar", "financeiro.ver_propria_comissao",
  ]),
  FINANCE: new Set([
    "servicos.ver", "financeiro.gerenciar", "orcamentos.aprovar",
  ]),
};

export function hasCapability(role: StaffRole, capability: Capability): boolean {
  return ROLE_CAPABILITIES[role]?.has(capability) ?? false;
}

export function requireCapability(role: StaffRole, capability: Capability): void {
  if (!hasCapability(role, capability)) {
    throw new AuthorizationError(`Papel ${role} não tem a capacidade ${capability}`);
  }
}

export class AuthorizationError extends Error {
  readonly httpStatus = 403;
  constructor(message: string) {
    super(message);
    this.name = "AuthorizationError";
  }
}
