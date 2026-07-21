import * as React from "react";
import { MaskedInput, type MaskedInputProps } from "./masked-input";
import { isValidCpfCnpj } from "./br-document-validators";

/**
 * PhoneInput — resolve o padrão dinamicamente pelo tamanho: 10 dígitos (fixo, "(##) ####-####")
 * ou 11 dígitos (celular, "(##) #####-####"). Cobre o formato brasileiro real, onde o
 * usuário não escolhe antecipadamente se é celular ou fixo.
 */
export const PhoneInput = React.forwardRef<HTMLInputElement, Omit<MaskedInputProps, "pattern" | "resolvePattern">>(
  (props, ref) => (
    <MaskedInput
      ref={ref}
      resolvePattern={(digits) => (digits.length > 10 ? "(##) #####-####" : "(##) ####-####")}
      maxDigits={11}
      placeholder="(00) 00000-0000"
      {...props}
    />
  )
);
PhoneInput.displayName = "PhoneInput";

/**
 * CpfCnpjInput — um único campo que se comporta como CPF (11 dígitos) ou CNPJ (14) de
 * acordo com o que a pessoa está digitando, em vez de dois componentes ou um seletor
 * de tipo prévio. `onValidityChange` expõe o resultado do validador de dígito
 * verificador para quem quiser feedback em tempo real.
 */
export interface CpfCnpjInputProps extends Omit<MaskedInputProps, "pattern" | "resolvePattern" | "maxDigits"> {
  onValidityChange?: (valid: boolean) => void;
}

export const CpfCnpjInput = React.forwardRef<HTMLInputElement, CpfCnpjInputProps>(
  ({ onValueChange, onValidityChange, ...props }, ref) => (
    <MaskedInput
      ref={ref}
      resolvePattern={(digits) => (digits.length > 11 ? "##.###.###/####-##" : "###.###.###-##")}
      maxDigits={14}
      placeholder="CPF ou CNPJ"
      onValueChange={(value) => {
        onValueChange?.(value);
        onValidityChange?.(isValidCpfCnpj(value.raw));
      }}
      {...props}
    />
  )
);
CpfCnpjInput.displayName = "CpfCnpjInput";

export const CepInput = React.forwardRef<HTMLInputElement, Omit<MaskedInputProps, "pattern" | "resolvePattern">>(
  (props, ref) => (
    <MaskedInput ref={ref} pattern="#####-###" maxDigits={8} placeholder="00000-000" {...props} />
  )
);
CepInput.displayName = "CepInput";
