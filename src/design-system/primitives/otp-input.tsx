import * as React from "react";
import { cn } from "../lib/cn";
import { MaskedInput, stripNonDigits } from "./masked-input";

export interface OtpInputProps {
  value: string;
  onValueChange: (value: string) => void;
  length?: number;
  disabled?: boolean;
  className?: string;
  "aria-label": string;
}

/**
 * OTPInput não introduz motor novo — é o MaskedInput da Onda 3a com um pattern gerado
 * (### para length=6 vira "# # # # # #") e uma máscara CSS de background que desenha
 * as divisórias entre "caixas" sobre um único <input>, não N inputs reais. Isso
 * preserva `autoComplete="one-time-code"` funcionando nativamente para autopreenchimento
 * de SMS no iOS/Android — que quebra com frequência em implementações de N inputs
 * separados por causa da gestão de foco entre eles.
 */
export function OtpInput({ value, onValueChange, length = 6, disabled, className, ...props }: OtpInputProps) {
  const pattern = Array.from({ length }, () => "#").join(" ");
  const boxWidth = 40;
  const gap = 8;

  return (
    <MaskedInput
      pattern={pattern}
      maxDigits={length}
      value={value}
      onValueChange={({ raw }) => onValueChange(stripNonDigits(raw))}
      disabled={disabled}
      autoComplete="one-time-code"
      inputMode="numeric"
      aria-label={props["aria-label"]}
      className={cn(
        "text-center tracking-[0.6em] font-mono text-base",
        className
      )}
      style={{ width: length * boxWidth + (length - 1) * gap }}
    />
  );
}
