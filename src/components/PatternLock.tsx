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
  const dotsRef = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    if (value) {
      setPattern(value.split(',').map(Number).filter(n => !isNaN(n)));
    }
  }, [value]);

  const addToPattern = (index: number) => {
    if (!pattern.includes(index)) {
      const newPattern = [...pattern, index];
      setPattern(newPattern);
      onChange(newPattern.join(','));
    }
  };

  const handleStart = (index: number) => {
    if (disabled) return;
    setIsDrawing(true);
    const newPattern = [index];
    setPattern(newPattern);
    onChange(newPattern.join(','));
  };

  const handleMove = (e: MouseEvent | TouchEvent) => {
    if (!isDrawing || disabled) return;

    let clientX: number, clientY: number;
    
    if (e instanceof MouseEvent) {
      clientX = e.clientX;
      clientY = e.clientY;
    } else {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    }

    // Encontrar qual ponto está sob o cursor
    dotsRef.current.forEach((dot, index) => {
      if (!dot) return;
      const rect = dot.getBoundingClientRect();
      if (
        clientX >= rect.left &&
        clientX <= rect.right &&
        clientY >= rect.top &&
        clientY <= rect.bottom
      ) {
        addToPattern(index);
      }
    });
  };

  const handleEnd = () => {
    setIsDrawing(false);
  };

  const handleClear = () => {
    setPattern([]);
    onChange('');
  };

  useEffect(() => {
    if (!isDrawing) return;

    const handleGlobalMove = (e: MouseEvent | TouchEvent) => {
      handleMove(e);
    };

    const handleGlobalEnd = () => {
      setIsDrawing(false);
    };

    window.addEventListener('mousemove', handleGlobalMove as any);
    window.addEventListener('touchmove', handleGlobalMove as any);
    window.addEventListener('mouseup', handleGlobalEnd);
    window.addEventListener('touchend', handleGlobalEnd);

    return () => {
      window.removeEventListener('mousemove', handleGlobalMove as any);
      window.removeEventListener('touchmove', handleGlobalMove as any);
      window.removeEventListener('mouseup', handleGlobalEnd);
      window.removeEventListener('touchend', handleGlobalEnd);
    };
  }, [isDrawing, pattern, disabled]);

  const getPosition = (index: number) => {
    const row = Math.floor(index / 3);
    const col = index % 3;
    return {
      x: col * 110 + 55,
      y: row * 110 + 55,
    };
  };

  const renderLines = () => {
    if (pattern.length < 2) return null;

    return (
      <svg
        className="absolute inset-0 pointer-events-none"
        style={{ width: '330px', height: '330px' }}
      >
        <defs>
          <marker
            id="arrowhead"
            markerWidth="8"
            markerHeight="8"
            refX="7"
            refY="4"
            orient="auto"
          >
            <polygon points="0 0, 8 4, 0 8" fill="hsl(var(--primary))" />
          </marker>
        </defs>
        {pattern.map((point, index) => {
          if (index === pattern.length - 1) return null;
          const start = getPosition(point);
          const end = getPosition(pattern[index + 1]);
          
          // Calcular o ângulo e encurtar a linha para não sobrepor os pontos
          const dx = end.x - start.x;
          const dy = end.y - start.y;
          const length = Math.sqrt(dx * dx + dy * dy);
          const unitX = dx / length;
          const unitY = dy / length;
          
          const offset = 15;
          const startX = start.x + unitX * offset;
          const startY = start.y + unitY * offset;
          const endX = end.x - unitX * (offset + 8);
          const endY = end.y - unitY * (offset + 8);
          
          return (
            <line
              key={`${point}-${pattern[index + 1]}`}
              x1={startX}
              y1={startY}
              x2={endX}
              y2={endY}
              stroke="hsl(var(--primary))"
              strokeWidth="3.5"
              markerEnd="url(#arrowhead)"
            />
          );
        })}
      </svg>
    );
  };

  return (
    <div className="flex flex-col gap-6">
      <div
        ref={containerRef}
        className="relative p-8 bg-muted/20 rounded-xl border border-border w-fit mx-auto select-none touch-none"
        style={{ width: '330px', height: '330px' }}
      >
        {renderLines()}
        <div className="grid grid-cols-3 gap-0 w-full h-full">
          {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((index) => {
            const isActive = pattern.includes(index);
            const orderIndex = pattern.indexOf(index);
            
            return (
              <div
                key={index}
                className="flex items-center justify-center"
              >
                <div
                  ref={(el) => (dotsRef.current[index] = el)}
                  className={cn(
                    "w-8 h-8 rounded-full transition-all cursor-pointer flex items-center justify-center font-semibold text-xs z-10",
                    isActive
                      ? "bg-primary text-primary-foreground shadow-lg scale-110"
                      : "bg-background border-2 border-muted-foreground/20 hover:border-primary/40 text-muted-foreground hover:scale-105",
                    disabled && "opacity-50 cursor-not-allowed"
                  )}
                  onMouseDown={() => handleStart(index)}
                  onTouchStart={(e) => {
                    e.preventDefault();
                    handleStart(index);
                  }}
                  data-index={index}
                >
                  {isActive ? orderIndex + 1 : ''}
                </div>
              </div>
            );
          })}
        </div>
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
