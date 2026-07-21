import * as React from "react";
import { Input, type InputProps } from "./input";

/**
 * Motor único de máscara. Um único componente controlado — CurrencyInput, PhoneInput,
 * CpfCnpjInput e CepInput são presets finos por cima dele, não implementações
 * separadas. Ver justificativa na Onda 3a do roadmap: 5 componentes duplicando lógica
 * de máscara violaria o princípio de Restrição do CodeChain Design Language (seção 1.2).
 *
 * Padrão de máscara: "#" = dígito. Qualquer outro caractere é literal.
 * Ex: "###.###.###-##" (CPF), "(##) #####-####" (telefone celular BR).
 */
export function applyMask(rawDigits: string, pattern: string): string {
  let result = "";
  let digitIndex = 0;
  for (let i = 0; i < pattern.length && digitIndex < rawDigits.length; i++) {
    const patternChar = pattern[i];
    if (patternChar === "#") {
      result += rawDigits[digitIndex];
      digitIndex++;
    } else {
      result += patternChar;
    }
  }
  return result;
}

export function stripNonDigits(value: string): string {
  return value.replace(/\D/g, "");
}

export interface MaskedInputProps extends Omit<InputProps, "onChange" | "value" | "defaultValue"> {
  /** Padrão fixo. Para máscara dinâmica (ex: CPF vs CNPJ pelo tamanho), use `resolvePattern`. */
  pattern?: string;
  /** Escolhe o padrão dinamicamente a partir dos dígitos já digitados — ex: CPF/CNPJ. */
  resolvePattern?: (rawDigits: string) => string;
  /** Quantidade máxima de dígitos aceitos (deriva do maior pattern, se não informado). */
  maxDigits?: number;
  value?: string;
  /** Recebe tanto o valor formatado (para exibição) quanto o valor cru (para persistir/validar). */
  onValueChange?: (value: { masked: string; raw: string }) => void;
}

export const MaskedInput = React.forwardRef<HTMLInputElement, MaskedInputProps>(
  ({ pattern, resolvePattern, maxDigits, value, onValueChange, ...props }, ref) => {
    const [internalDigits, setInternalDigits] = React.useState(() => stripNonDigits(value ?? ""));

    const activePattern = resolvePattern ? resolvePattern(internalDigits) : pattern ?? "";
    const effectiveMax = maxDigits ?? activePattern.split("").filter((c) => c === "#").length;
    const masked = applyMask(internalDigits, activePattern);

    function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
      const digits = stripNonDigits(e.target.value).slice(0, effectiveMax);
      setInternalDigits(digits);
      const nextPattern = resolvePattern ? resolvePattern(digits) : pattern ?? "";
      onValueChange?.({ masked: applyMask(digits, nextPattern), raw: digits });
    }

    return (
      <Input
        ref={ref}
        inputMode="numeric"
        value={masked}
        onChange={handleChange}
        {...props}
      />
    );
  }
);
MaskedInput.displayName = "MaskedInput";
