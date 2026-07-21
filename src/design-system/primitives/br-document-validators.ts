/**
 * Validadores de CPF/CNPJ — lógica de domínio pura, sem nenhuma dependência de UI.
 * Vive aqui por enquanto porque só tem um consumidor (CpfCnpjInput). No dia em que o
 * backend também precisar validar (ex: cadastro de cliente pelo Server Action), isso
 * migra para um pacote próprio (@codechain/br-validators) — ver ADR de topologia de
 * pacotes em docs/02-hierarchy-and-theming.md. Até lá, duplicar aqui seria prematuro.
 */

export function isValidCPF(digits: string): boolean {
  if (digits.length !== 11 || /^(\d)\1{10}$/.test(digits)) return false;
  const calc = (len: number) => {
    let sum = 0;
    for (let i = 0; i < len; i++) sum += Number(digits[i]) * (len + 1 - i);
    const rest = (sum * 10) % 11;
    return rest === 10 ? 0 : rest;
  };
  return calc(9) === Number(digits[9]) && calc(10) === Number(digits[10]);
}

export function isValidCNPJ(digits: string): boolean {
  if (digits.length !== 14 || /^(\d)\1{13}$/.test(digits)) return false;
  const calcDigit = (base: string) => {
    const weights = base.length === 12 ? [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2] : [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    const sum = base.split("").reduce((acc, d, i) => acc + Number(d) * weights[i], 0);
    const rest = sum % 11;
    return rest < 2 ? 0 : 11 - rest;
  };
  const d1 = calcDigit(digits.slice(0, 12));
  const d2 = calcDigit(digits.slice(0, 12) + d1);
  return d1 === Number(digits[12]) && d2 === Number(digits[13]);
}

/** Valida CPF (11 dígitos) ou CNPJ (14 dígitos) — a mesma dupla usada pelo CpfCnpjInput. */
export function isValidCpfCnpj(digits: string): boolean {
  if (digits.length === 11) return isValidCPF(digits);
  if (digits.length === 14) return isValidCNPJ(digits);
  return false;
}
