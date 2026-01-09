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
  const [containerSize, setContainerSize] = useState(280);
  const containerRef = useRef<HTMLDivElement>(null);
  const dotsRef = useRef<(HTMLDivElement | null)[]>([]);

  // Atualizar tamanho do container
  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        const size = containerRef.current.offsetWidth;
        setContainerSize(size);
      }
    };
    
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  // Sincronizar apenas quando não estiver desenhando e o valor externo mudar
  useEffect(() => {
    if (!isDrawing && value !== undefined) {
      const newPattern = value ? value.split(',').map(Number).filter(n => !isNaN(n)) : [];
      setPattern(newPattern);
    }
  }, [value, isDrawing]);

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

    // Encontrar qual ponto está sob o cursor com área de detecção maior
    dotsRef.current.forEach((dot, index) => {
      if (!dot) return;
      const rect = dot.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      
      // Calcular distância do cursor ao centro do ponto
      const distance = Math.sqrt(
        Math.pow(clientX - centerX, 2) + Math.pow(clientY - centerY, 2)
      );
      
      // Raio de detecção aumentado (40px para facilitar o arraste)
      const hitRadius = 40;
      
      if (distance <= hitRadius) {
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
    // Calcular baseado no tamanho real do container
    const padding = containerSize * 0.097; // ~32px em 330px
    const gridSize = containerSize - (padding * 2);
    const cellSize = gridSize / 3;
    return {
      x: padding + col * cellSize + cellSize / 2,
      y: padding + row * cellSize + cellSize / 2,
    };
  };

  const renderLines = () => {
    if (pattern.length < 2) return null;

    // Calcular tamanho do círculo baseado no container
    const circleRadius = containerSize * 0.0485; // ~16px em 330px
    const arrowSize = containerSize * 0.018; // ~6px em 330px

    return (
      <svg
        className="absolute top-0 left-0 pointer-events-none"
        style={{ width: containerSize, height: containerSize }}
      >
        <defs>
          <marker
            id="arrowhead"
            markerWidth="6"
            markerHeight="6"
            refX="5.5"
            refY="3"
            orient="auto"
          >
            <polygon points="0 0, 6 3, 0 6" fill="hsl(var(--primary))" />
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
          
          // Começa na borda do círculo de origem
          const startX = start.x + unitX * circleRadius;
          const startY = start.y + unitY * circleRadius;
          // Termina na borda do círculo de destino (menos o tamanho da seta)
          const endX = end.x - unitX * (circleRadius + arrowSize);
          const endY = end.y - unitY * (circleRadius + arrowSize);
          
          return (
            <line
              key={`${point}-${pattern[index + 1]}`}
              x1={startX}
              y1={startY}
              x2={endX}
              y2={endY}
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
        className="relative p-6 sm:p-8 bg-muted/20 rounded-xl border border-border w-full max-w-[280px] mx-auto select-none touch-none aspect-square"
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
                    "w-8 h-8 rounded-full transition-all cursor-pointer flex items-center justify-center font-semibold text-sm z-10",
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
      
      <div className="flex items-center gap-3 justify-center flex-wrap">
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
