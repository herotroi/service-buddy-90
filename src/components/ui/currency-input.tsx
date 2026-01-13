import * as React from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface CurrencyInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'> {
  value: number | string | undefined | null;
  onChange: (value: number | undefined) => void;
}

// Formata número para exibição em BRL (1234.56 -> "1.234,56")
const formatCurrency = (value: number | string | undefined | null): string => {
  if (value === undefined || value === null || value === '') return '';
  
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(numValue)) return '';
  
  return numValue.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

// Converte string formatada para número (1.234,56 -> 1234.56)
const parseCurrency = (value: string): number | undefined => {
  if (!value || value.trim() === '') return undefined;
  
  // Remove pontos (separador de milhar) e substitui vírgula por ponto
  const normalized = value
    .replace(/\./g, '')
    .replace(',', '.');
  
  const parsed = parseFloat(normalized);
  return isNaN(parsed) ? undefined : parsed;
};

const CurrencyInput = React.forwardRef<HTMLInputElement, CurrencyInputProps>(
  ({ className, value, onChange, onBlur, ...props }, ref) => {
    const [displayValue, setDisplayValue] = React.useState<string>('');
    const [isFocused, setIsFocused] = React.useState(false);

    // Sincroniza o valor externo com o display quando não está em foco
    React.useEffect(() => {
      if (!isFocused) {
        setDisplayValue(formatCurrency(value));
      }
    }, [value, isFocused]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      let inputValue = e.target.value;
      
      // Permite apenas números, vírgula e ponto
      inputValue = inputValue.replace(/[^\d.,]/g, '');
      
      // Garante apenas uma vírgula ou ponto como separador decimal
      const parts = inputValue.split(/[.,]/);
      if (parts.length > 2) {
        // Se houver mais de um separador, mantém apenas o primeiro
        inputValue = parts[0] + ',' + parts.slice(1).join('');
      }
      
      // Limita a 2 casas decimais
      const decimalMatch = inputValue.match(/[.,](\d*)/);
      if (decimalMatch && decimalMatch[1].length > 2) {
        const intPart = inputValue.split(/[.,]/)[0];
        inputValue = intPart + ',' + decimalMatch[1].slice(0, 2);
      }
      
      // Normaliza para usar vírgula como separador decimal
      inputValue = inputValue.replace('.', ',');
      
      setDisplayValue(inputValue);
      
      // Notifica o valor numérico
      const numValue = parseCurrency(inputValue);
      onChange(numValue);
    };

    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(true);
      // Remove formatação ao focar para facilitar edição
      if (value !== undefined && value !== null && value !== '') {
        const numValue = typeof value === 'string' ? parseFloat(value) : value;
        if (!isNaN(numValue)) {
          // Mostra o valor sem formatação de milhar, apenas com vírgula decimal
          setDisplayValue(numValue.toFixed(2).replace('.', ','));
        }
      }
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(false);
      // Formata o valor ao sair do campo
      const numValue = parseCurrency(displayValue);
      if (numValue !== undefined) {
        setDisplayValue(formatCurrency(numValue));
        onChange(numValue);
      } else {
        setDisplayValue('');
        onChange(undefined);
      }
      onBlur?.(e);
    };

    return (
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
          R$
        </span>
        <Input
          ref={ref}
          type="text"
          inputMode="decimal"
          className={cn("pl-10", className)}
          value={displayValue}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder="0,00"
          {...props}
        />
      </div>
    );
  }
);

CurrencyInput.displayName = "CurrencyInput";

export { CurrencyInput, formatCurrency, parseCurrency };
