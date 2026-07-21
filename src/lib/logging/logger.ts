export interface LogFields {
  requestId?: string;
  organizationId?: string;
  userId?: string;
  [key: string]: unknown;
}

/**
 * Substitui console.log de string livre por JSON estruturado, como o Design
 * Language (cap. 18.1) exigia desde a arquitetura original — só ganhou
 * implementação real agora que a Fase 3 existe. Nível `error` também dispara
 * error tracking quando o provedor estiver configurado (TODO: integração real,
 * fora do alcance deste ambiente sem rede).
 */
function log(level: "info" | "warn" | "error", event: string, fields: LogFields = {}) {
  const entry = { level, event, timestamp: new Date().toISOString(), ...fields };
  const line = JSON.stringify(entry);
  if (level === "error") console.error(line);
  else if (level === "warn") console.warn(line);
  else console.log(line);
}

export const logger = {
  info: (event: string, fields?: LogFields) => log("info", event, fields),
  warn: (event: string, fields?: LogFields) => log("warn", event, fields),
  error: (event: string, fields?: LogFields) => log("error", event, fields),
};
