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
      x: col * 80 + 40,
      y: row * 80 + 40,
    };
  };

  const renderLines = () => {
    if (pattern.length < 2) return null;

    return (
      <svg
        className="absolute inset-0 pointer-events-none"
        style={{ width: '240px', height: '240px' }}
      >
        <defs>
          <marker
            id="arrowhead"
            markerWidth="10"
            markerHeight="10"
            refX="8"
            refY="3"
            orient="auto"
            className="fill-primary"
          >
            <polygon points="0 0, 10 3, 0 6" className="fill-primary" />
          </marker>
        </defs>
        {pattern.map((point, index) => {
          if (index === pattern.length - 1) return null;
          const start = getPosition(point);
          const end = getPosition(pattern[index + 1]);
          
          return (
            <line
              key={`${point}-${pattern[index + 1]}`}
              x1={start.x}
              y1={start.y}
              x2={end.x}
              y2={end.y}
              stroke="hsl(var(--primary))"
              strokeWidth="3"
              markerEnd="url(#arrowhead)"
            />
          );
        })}
      </svg>
    );
  };

  return (
    <div className="flex flex-col gap-4">
      <div
        ref={containerRef}
        className="relative grid grid-cols-3 gap-20 p-8 bg-muted/30 rounded-lg border-2 border-border w-fit mx-auto select-none touch-none"
        style={{ width: '240px', height: '240px' }}
      >
        {renderLines()}
        {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((index) => {
          const isActive = pattern.includes(index);
          const orderIndex = pattern.indexOf(index);
          
          return (
            <div
              key={index}
              ref={(el) => (dotsRef.current[index] = el)}
              className={cn(
                "absolute w-10 h-10 rounded-full transition-all cursor-pointer flex items-center justify-center font-medium text-xs z-10",
                isActive
                  ? "bg-primary text-primary-foreground shadow-lg"
                  : "bg-muted border-2 border-muted-foreground/30 hover:border-primary/50 text-muted-foreground",
                disabled && "opacity-50 cursor-not-allowed"
              )}
              style={{
                left: `${(index % 3) * 80}px`,
                top: `${Math.floor(index / 3) * 80}px`,
              }}
              onMouseDown={() => handleStart(index)}
              onTouchStart={(e) => {
                e.preventDefault();
                handleStart(index);
              }}
              data-index={index}
            >
              {isActive ? orderIndex + 1 : '•'}
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
