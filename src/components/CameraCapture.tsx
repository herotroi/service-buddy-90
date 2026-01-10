import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Camera, Video, X, SwitchCamera, Circle, Square } from 'lucide-react';

interface CameraCaptureProps {
  open: boolean;
  onClose: () => void;
  onCapture: (file: File) => void;
  mode: 'photo' | 'video';
}

export const CameraCapture = ({ open, onClose, onCapture, mode }: CameraCaptureProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const isStartingRef = useRef(false);
  
  const [isRecording, setIsRecording] = useState(false);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [cameraReady, setCameraReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraReady(false);
    setIsRecording(false);
    isStartingRef.current = false;
  }, []);

  const startCamera = useCallback(async () => {
    // Prevent multiple simultaneous starts
    if (isStartingRef.current) return;
    isStartingRef.current = true;
    
    try {
      setError(null);
      setCameraReady(false);
      
      // Stop existing stream first
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }

      // Wait a bit for cleanup
      await new Promise(resolve => setTimeout(resolve, 100));

      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: facingMode,
          width: { ideal: 1920, min: 1280 },
          height: { ideal: 1080, min: 720 }
        },
        audio: mode === 'video'
      };

      console.log('Requesting camera access...');
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      
      // Check if component is still mounted/open
      if (!isStartingRef.current) {
        stream.getTracks().forEach(track => track.stop());
        return;
      }
      
      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        
        // Wait for video to be ready
        await new Promise<void>((resolve, reject) => {
          const video = videoRef.current;
          if (!video) {
            reject(new Error('Video element not found'));
            return;
          }
          
          const onCanPlay = () => {
            video.removeEventListener('canplay', onCanPlay);
            video.removeEventListener('error', onError);
            resolve();
          };
          
          const onError = () => {
            video.removeEventListener('canplay', onCanPlay);
            video.removeEventListener('error', onError);
            reject(new Error('Video error'));
          };
          
          video.addEventListener('canplay', onCanPlay);
          video.addEventListener('error', onError);
        });
        
        try {
          await videoRef.current.play();
          console.log('Camera started successfully');
          setCameraReady(true);
        } catch (playError: any) {
          // Ignore AbortError as it's often just from quick unmount
          if (playError.name !== 'AbortError') {
            throw playError;
          }
        }
      }
    } catch (err: any) {
      console.error('Erro ao acessar câmera:', err);
      if (err.name === 'NotAllowedError') {
        setError('Permissão para câmera negada. Por favor, permita o acesso à câmera nas configurações do navegador.');
      } else if (err.name === 'NotFoundError') {
        setError('Nenhuma câmera encontrada no dispositivo.');
      } else if (err.name === 'NotReadableError') {
        setError('A câmera está sendo usada por outro aplicativo.');
      } else if (err.name !== 'AbortError') {
        setError('Erro ao acessar a câmera. Verifique as permissões do navegador.');
      }
    } finally {
      isStartingRef.current = false;
    }
  }, [facingMode, mode]);

  // Start camera when dialog opens
  useEffect(() => {
    if (open) {
      // Small delay to ensure dialog is rendered
      const timer = setTimeout(() => {
        startCamera();
      }, 200);
      return () => clearTimeout(timer);
    } else {
      stopCamera();
    }
  }, [open]);

  // Handle facingMode change
  useEffect(() => {
    if (open && cameraReady) {
      startCamera();
    }
  }, [facingMode]);

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      stopCamera();
      onClose();
    }
  };

  const switchCamera = () => {
    setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
  };

  const takePhoto = () => {
    if (!videoRef.current || !cameraReady) return;

    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(videoRef.current, 0, 0);
    
    canvas.toBlob((blob) => {
      if (blob) {
        const file = new File([blob], `foto-${Date.now()}.jpg`, { type: 'image/jpeg' });
        onCapture(file);
        stopCamera();
        onClose();
      }
    }, 'image/jpeg', 0.95);
  };

  const startRecording = () => {
    if (!streamRef.current || !cameraReady) return;

    chunksRef.current = [];
    
    const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9') 
      ? 'video/webm;codecs=vp9' 
      : MediaRecorder.isTypeSupported('video/webm') 
        ? 'video/webm' 
        : 'video/mp4';

    const mediaRecorder = new MediaRecorder(streamRef.current, { mimeType });
    
    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        chunksRef.current.push(event.data);
      }
    };

    mediaRecorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: mimeType });
      const extension = mimeType.includes('webm') ? 'webm' : 'mp4';
      const file = new File([blob], `video-${Date.now()}.${extension}`, { type: mimeType });
      onCapture(file);
      stopCamera();
      onClose();
    };

    mediaRecorderRef.current = mediaRecorder;
    mediaRecorder.start();
    setIsRecording(true);
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg p-0 overflow-hidden" aria-describedby={undefined}>
        <DialogHeader className="p-4 pb-0">
          <DialogTitle className="flex items-center gap-2">
            {mode === 'photo' ? <Camera className="w-5 h-5" /> : <Video className="w-5 h-5" />}
            {mode === 'photo' ? 'Tirar Foto' : 'Gravar Vídeo'}
          </DialogTitle>
        </DialogHeader>
        
        <div className="relative bg-black aspect-video">
          {error ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-white text-center p-4 gap-4">
              <p>{error}</p>
              <Button variant="secondary" onClick={startCamera}>
                Tentar Novamente
              </Button>
            </div>
          ) : (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
          )}
          
          {!cameraReady && !error && (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-white gap-2">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
              <p className="text-sm">Iniciando câmera...</p>
            </div>
          )}

          {isRecording && (
            <div className="absolute top-4 left-4 flex items-center gap-2 bg-red-600 text-white px-3 py-1 rounded-full text-sm">
              <Circle className="w-3 h-3 fill-current animate-pulse" />
              Gravando...
            </div>
          )}
        </div>

        <div className="p-4 flex items-center justify-center gap-4">
          <Button
            variant="outline"
            size="icon"
            onClick={switchCamera}
            disabled={!cameraReady || isRecording}
            className="rounded-full"
          >
            <SwitchCamera className="w-5 h-5" />
          </Button>

          {mode === 'photo' ? (
            <Button
              size="lg"
              onClick={takePhoto}
              disabled={!cameraReady}
              className="rounded-full w-16 h-16"
            >
              <Camera className="w-8 h-8" />
            </Button>
          ) : (
            <Button
              size="lg"
              onClick={isRecording ? stopRecording : startRecording}
              disabled={!cameraReady}
              variant={isRecording ? "destructive" : "default"}
              className="rounded-full w-16 h-16"
            >
              {isRecording ? <Square className="w-6 h-6" /> : <Circle className="w-8 h-8 fill-current" />}
            </Button>
          )}

          <Button
            variant="outline"
            size="icon"
            onClick={() => { stopCamera(); onClose(); }}
            className="rounded-full"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
