import { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface PatternLockProps {
  value?: string;
  onChange: (pattern: string) => void;
  disabled?: boolean;
}

export const PatternLock = ({ value, onChange, disabled }: PatternLockProps) => {
  const [pattern, setPattern] = useState<number[]>(value ? value.split(',').map(Number) : []);
  const [isDrawing, setIsDrawing] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (value) {
      setPattern(value.split(',').map(Number).filter(n => !isNaN(n)));
    }
  }, [value]);

  const handleStart = (index: number) => {
    if (disabled) return;
    setIsDrawing(true);
    const newPattern = [index];
    setPattern(newPattern);
    onChange(newPattern.join(','));
  };

  const handleMove = (index: number) => {
    if (!isDrawing || disabled) return;
    if (!pattern.includes(index)) {
      const newPattern = [...pattern, index];
      setPattern(newPattern);
      onChange(newPattern.join(','));
    }
  };

  const handleEnd = () => {
    setIsDrawing(false);
  };

  const handleClear = () => {
    setPattern([]);
    onChange('');
  };

  useEffect(() => {
    const handleGlobalEnd = () => setIsDrawing(false);
    window.addEventListener('mouseup', handleGlobalEnd);
    window.addEventListener('touchend', handleGlobalEnd);
    return () => {
      window.removeEventListener('mouseup', handleGlobalEnd);
      window.removeEventListener('touchend', handleGlobalEnd);
    };
  }, []);

  return (
    <div className="flex flex-col gap-4">
      <div
        ref={containerRef}
        className="grid grid-cols-3 gap-4 p-6 bg-muted/30 rounded-lg border-2 border-border w-fit mx-auto select-none"
        onMouseLeave={handleEnd}
      >
        {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((index) => {
          const isActive = pattern.includes(index);
          const orderIndex = pattern.indexOf(index);
          
          return (
            <div
              key={index}
              className={cn(
                "w-16 h-16 rounded-full border-4 transition-all cursor-pointer flex items-center justify-center font-semibold text-lg",
                isActive
                  ? "bg-primary border-primary text-primary-foreground scale-110"
                  : "bg-background border-muted-foreground/30 hover:border-primary/50",
                disabled && "opacity-50 cursor-not-allowed"
              )}
              onMouseDown={() => handleStart(index)}
              onMouseEnter={() => handleMove(index)}
              onTouchStart={() => handleStart(index)}
              onTouchMove={(e) => {
                const touch = e.touches[0];
                const element = document.elementFromPoint(touch.clientX, touch.clientY);
                if (element && element.getAttribute('data-index')) {
                  handleMove(parseInt(element.getAttribute('data-index')!));
                }
              }}
              data-index={index}
            >
              {isActive && orderIndex + 1}
            </div>
          );
        })}
      </div>
      
      <div className="flex items-center gap-3 justify-center">
        <button
          type="button"
          onClick={handleClear}
          disabled={disabled || pattern.length === 0}
          className="text-sm text-muted-foreground hover:text-foreground disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Limpar padrão
        </button>
        {pattern.length > 0 && (
          <span className="text-sm text-muted-foreground">
            {pattern.length} {pattern.length === 1 ? 'ponto' : 'pontos'} selecionados
          </span>
        )}
      </div>
    </div>
  );
};
