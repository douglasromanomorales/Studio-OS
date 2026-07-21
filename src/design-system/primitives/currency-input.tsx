import * as React from "react";
import { Input, type InputProps } from "./input";

/**
 * CurrencyInput — não usa o motor de MaskedInput (padrão "#") porque moeda não é um
 * padrão fixo de posições: o separador de milhar se move conforme o valor cresce
 * (R$ 1,00 → R$ 10,00 → R$ 100,00 → R$ 1.000,00). Precisa de Intl.NumberFormat, não
 * de um template de caracteres. Componente próprio, não preset do MaskedInput.
 *
 * Guarda o valor internamente em centavos (inteiro) — evita todo o problema clássico
 * de ponto flutuante em valor monetário (0.1 + 0.2 !== 0.3).
 */
export interface CurrencyInputProps
  extends Omit<InputProps, "value" | "defaultValue" | "onChange"> {
  /** Valor em centavos (ex: R$ 129,90 = 12990). Fonte da verdade — nunca reais fracionados. */
  valueInCents: number;
  onValueChange: (cents: number) => void;
  currency?: string;
  locale?: string;
}

const formatter = (locale: string, currency: string) =>
  new Intl.NumberFormat(locale, { style: "currency", currency });

export const CurrencyInput = React.forwardRef<HTMLInputElement, CurrencyInputProps>(
  ({ valueInCents, onValueChange, currency = "BRL", locale = "pt-BR", ...props }, ref) => {
    const display = formatter(locale, currency).format(valueInCents / 100);

    function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
      const digitsOnly = e.target.value.replace(/\D/g, "");
      onValueChange(digitsOnly ? Number(digitsOnly) : 0);
    }

    return (
      <Input
        ref={ref}
        inputMode="decimal"
        value={display}
        onChange={handleChange}
        {...props}
      />
    );
  }
);
CurrencyInput.displayName = "CurrencyInput";
