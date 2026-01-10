import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Download, Play, AlertCircle } from 'lucide-react';

interface UniversalVideoPlayerProps {
  src: string;
  name?: string;
  className?: string;
  controlsList?: string;
  onContextMenu?: (e: React.MouseEvent) => void;
}

export const UniversalVideoPlayer = ({ 
  src, 
  name = 'video',
  className = '',
  controlsList = 'nodownload',
  onContextMenu
}: UniversalVideoPlayerProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [hasError, setHasError] = useState(false);
  const [canPlay, setCanPlay] = useState(true);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Reset states when src changes
    setHasError(false);
    setCanPlay(true);
    setIsLoading(true);
  }, [src]);

  const handleError = () => {
    console.log('[UniversalVideoPlayer] Video error for:', name);
    setHasError(true);
    setIsLoading(false);
  };

  const handleCanPlay = () => {
    console.log('[UniversalVideoPlayer] Can play:', name);
    setCanPlay(true);
    setIsLoading(false);
  };

  const handleLoadedMetadata = () => {
    console.log('[UniversalVideoPlayer] Metadata loaded:', name);
    setIsLoading(false);
  };

  const handleDownload = () => {
    // Create a link and download the video
    const link = document.createElement('a');
    link.href = src;
    link.download = name || 'video';
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleOpenInNewTab = () => {
    window.open(src, '_blank');
  };

  // Check if the file is likely to have compatibility issues (MOV, HEVC)
  const isProblematicFormat = () => {
    const lowerName = (name || '').toLowerCase();
    return lowerName.endsWith('.mov') || lowerName.endsWith('.hevc');
  };

  // If there's an error, show fallback UI
  if (hasError) {
    return (
      <div className={`relative bg-muted rounded-lg flex flex-col items-center justify-center gap-3 p-4 ${className}`}>
        <AlertCircle className="w-8 h-8 text-muted-foreground" />
        <p className="text-sm text-muted-foreground text-center">
          Formato não suportado pelo navegador
        </p>
        <div className="flex gap-2">
          <Button
            type="button"
            size="sm"
            variant="secondary"
            onClick={handleOpenInNewTab}
            className="gap-1"
          >
            <Play className="w-3 h-3" />
            Abrir
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={handleDownload}
            className="gap-1"
          >
            <Download className="w-3 h-3" />
            Baixar
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      <video
        ref={videoRef}
        src={src}
        controls
        playsInline
        preload="metadata"
        className={className}
        controlsList={controlsList}
        onContextMenu={onContextMenu}
        onError={handleError}
        onCanPlay={handleCanPlay}
        onLoadedMetadata={handleLoadedMetadata}
      >
        <source src={src} />
        Seu navegador não suporta a reprodução de vídeos.
      </video>
      
      {/* Show download button for potentially problematic formats */}
      {isProblematicFormat() && !hasError && !isLoading && (
        <Button
          type="button"
          size="sm"
          variant="secondary"
          onClick={handleDownload}
          className="absolute bottom-12 right-2 gap-1 opacity-70 hover:opacity-100 text-xs"
        >
          <Download className="w-3 h-3" />
        </Button>
      )}
    </div>
  );
};
