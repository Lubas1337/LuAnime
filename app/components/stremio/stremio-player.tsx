'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import Hls from 'hls.js';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  SkipForward,
  SkipBack,
  Loader2,
  Settings,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { StreamSource } from '@/types/stremio';

const playbackRates = [0.5, 0.75, 1, 1.25, 1.5, 2];

const WEBTOR_SDK_URL = 'https://cdn.jsdelivr.net/npm/@webtor/embed-sdk-js/dist/index.min.js';

function WebtorPlayer({
  infoHash,
  fileName,
  poster,
}: {
  infoHash: string;
  fileName?: string;
  poster?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const idRef = useRef(`webtor-${infoHash.slice(0, 8)}-${Date.now()}`);

  useEffect(() => {
    const id = idRef.current;

    const w = window as any;
    w.webtor = w.webtor || [];
    w.webtor.push({
      id,
      magnet: `magnet:?xt=urn:btih:${infoHash}`,
      poster: poster || undefined,
      path: fileName || undefined,
      on: (e: { name: string }) => {
        if (e.name === 'error') {
          console.error('Webtor error', e);
        }
      },
      features: {
        autoplay: true,
        settings: true,
        fullscreen: true,
        subtitles: true,
        p2pProgress: false,
      },
      width: '100%',
      height: '100%',
    });

    // Load SDK script if not yet loaded
    if (!document.querySelector(`script[src="${WEBTOR_SDK_URL}"]`)) {
      const script = document.createElement('script');
      script.src = WEBTOR_SDK_URL;
      script.async = true;
      document.head.appendChild(script);
    } else {
      // SDK already loaded — re-trigger processing
      w.webtor?.init?.();
    }

    return () => {
      // Cleanup: clear the container
      const el = document.getElementById(id);
      if (el) el.innerHTML = '';
    };
  }, [infoHash, fileName, poster]);

  return (
    <div className="video-player-container relative">
      <div
        id={idRef.current}
        className="webtor w-full h-full"
      />
    </div>
  );
}

interface StremioPlayerProps {
  source: StreamSource | null;
  poster?: string;
  title?: string;
  onError?: () => void;
}

export function StremioPlayer({ source, poster, title, onError }: StremioPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const hlsRef = useRef<Hls | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [buffered, setBuffered] = useState(0);
  const [volume, setVolume] = useState(1);
  const [playbackRate, setPlaybackRate] = useState(1);

  const isPlayingRef = useRef(false);
  isPlayingRef.current = isPlaying;

  const initVideo = useCallback((url: string) => {
    if (!videoRef.current) return;

    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    const video = videoRef.current;

    if (url.includes('.m3u8') && Hls.isSupported()) {
      const hls = new Hls({ enableWorker: true, lowLatencyMode: true });
      hls.loadSource(url);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        setIsLoading(false);
        if (isPlayingRef.current) video.play();
      });

      hls.on(Hls.Events.ERROR, (_, data) => {
        if (data.fatal) {
          console.error('HLS error:', data);
          setIsLoading(false);
          onError?.();
        }
      });

      hlsRef.current = hls;
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = url;
      setIsLoading(false);
    } else {
      video.src = url;
      setIsLoading(false);
    }
  }, [onError]);

  useEffect(() => {
    if (source?.url) {
      setIsLoading(true);
      initVideo(source.url);
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [source?.url, initVideo]);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.volume = volume;
      videoRef.current.playbackRate = playbackRate;
    }
  }, [volume, playbackRate]);

  // Fullscreen events
  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement || !!(document as any).webkitFullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    document.addEventListener('webkitfullscreenchange', handleFsChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFsChange);
      document.removeEventListener('webkitfullscreenchange', handleFsChange);
    };
  }, []);

  // Auto-hide controls
  useEffect(() => {
    let hideTimeout: NodeJS.Timeout;
    const container = containerRef.current;

    const showAndScheduleHide = () => {
      setShowControls(true);
      clearTimeout(hideTimeout);
      if (isPlaying) {
        hideTimeout = setTimeout(() => setShowControls(false), 3000);
      }
    };

    if (container) {
      container.addEventListener('mousemove', showAndScheduleHide);
      container.addEventListener('touchstart', showAndScheduleHide);
      container.addEventListener('mouseleave', () => {
        if (isPlaying) setShowControls(false);
      });
    }

    return () => {
      if (container) {
        container.removeEventListener('mousemove', showAndScheduleHide);
        container.removeEventListener('touchstart', showAndScheduleHide);
      }
      clearTimeout(hideTimeout);
    };
  }, [isPlaying]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!videoRef.current || document.activeElement?.tagName === 'INPUT') return;

      switch (e.key) {
        case 'ArrowLeft':
          e.preventDefault();
          videoRef.current.currentTime = Math.max(0, videoRef.current.currentTime - 10);
          break;
        case 'ArrowRight':
          e.preventDefault();
          videoRef.current.currentTime = Math.min(duration, videoRef.current.currentTime + 10);
          break;
        case ' ':
          e.preventDefault();
          if (isPlaying) videoRef.current.pause();
          else videoRef.current.play();
          break;
        case 'f':
        case 'F':
          e.preventDefault();
          toggleFullscreen();
          break;
        case 'm':
        case 'M':
          e.preventDefault();
          toggleMute();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPlaying, duration]);

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) videoRef.current.pause();
    else videoRef.current.play();
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const toggleFullscreen = async () => {
    const container = containerRef.current;
    const video = videoRef.current;
    if (!container || !video) return;

    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) ||
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

    if (isFullscreen) {
      if (document.exitFullscreen) await document.exitFullscreen();
      else if ((document as any).webkitExitFullscreen) (document as any).webkitExitFullscreen();
    } else {
      if (isIOS && (video as any).webkitEnterFullscreen) (video as any).webkitEnterFullscreen();
      else if (container.requestFullscreen) await container.requestFullscreen();
      else if ((container as any).webkitRequestFullscreen) (container as any).webkitRequestFullscreen();
    }
  };

  const formatTime = (time: number) => {
    const h = Math.floor(time / 3600);
    const m = Math.floor((time % 3600) / 60);
    const s = Math.floor(time % 60);
    if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  if (!source) {
    return (
      <div className="video-player-container flex flex-col items-center justify-center bg-card gap-4">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-20"
          style={{ backgroundImage: poster ? `url(${poster})` : undefined }}
        />
        <div className="relative z-10 text-center space-y-4 p-4">
          <Play className="h-12 w-12 mx-auto text-primary opacity-70" />
          <div>
            <p className="text-foreground font-medium">{title || 'Stremio'}</p>
            <p className="text-sm text-muted-foreground mt-1">Выберите стрим для просмотра</p>
          </div>
        </div>
      </div>
    );
  }

  // Torrent stream — use Webtor.io Embed SDK
  if (source.isTorrent && source.infoHash) {
    return (
      <WebtorPlayer
        infoHash={source.infoHash}
        fileName={source.filename}
        poster={poster}
      />
    );
  }

  return (
    <div
      ref={containerRef}
      className={`video-player-container group ${isFullscreen ? 'fixed inset-0 z-50' : ''}`}
    >
      <video
        ref={videoRef}
        poster={poster}
        className="w-full h-full object-contain bg-black"
        onClick={togglePlay}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onTimeUpdate={() => {
          if (videoRef.current) setCurrentTime(videoRef.current.currentTime);
        }}
        onProgress={() => {
          if (videoRef.current && videoRef.current.buffered.length > 0) {
            setBuffered(videoRef.current.buffered.end(videoRef.current.buffered.length - 1));
          }
        }}
        onLoadedMetadata={() => {
          if (videoRef.current) setDuration(videoRef.current.duration);
        }}
        onWaiting={() => setIsLoading(true)}
        onCanPlay={() => setIsLoading(false)}
        onError={() => onError?.()}
        playsInline
      />

      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
      )}

      {/* Big play button */}
      <div
        className={`absolute inset-0 flex items-center justify-center transition-opacity duration-300 ${
          !isPlaying && !isLoading ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        <button
          onClick={togglePlay}
          className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/90 text-primary-foreground transition-transform hover:scale-110"
        >
          <Play className="h-10 w-10 fill-current ml-1" />
        </button>
      </div>

      {/* Controls */}
      <div
        className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent p-2 sm:p-4 transition-opacity duration-300 ${
          showControls ? 'opacity-100' : 'opacity-0'
        }`}
      >
        {/* Progress bar */}
        <div className="relative mb-2 sm:mb-3">
          <input
            type="range"
            min={0}
            max={duration || 100}
            value={currentTime}
            onChange={(e) => {
              const time = parseFloat(e.target.value);
              if (videoRef.current) {
                videoRef.current.currentTime = time;
                setCurrentTime(time);
              }
            }}
            className="w-full h-1 appearance-none bg-white/30 rounded-full cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary"
          />
          <div
            className="absolute top-0 left-0 h-1 bg-white/50 rounded-full pointer-events-none"
            style={{ width: `${(buffered / (duration || 1)) * 100}%` }}
          />
          <div
            className="absolute top-0 left-0 h-1 bg-primary rounded-full pointer-events-none"
            style={{ width: `${(currentTime / (duration || 1)) * 100}%` }}
          />
        </div>

        <div className="flex items-center justify-between gap-1">
          <div className="flex items-center gap-0.5 sm:gap-2 flex-shrink-0">
            <Button variant="ghost" size="icon" onClick={togglePlay} className="h-8 w-8 sm:h-9 sm:w-9 text-white hover:bg-white/20">
              {isPlaying ? <Pause className="h-4 w-4 sm:h-5 sm:w-5" /> : <Play className="h-4 w-4 sm:h-5 sm:w-5 fill-current" />}
            </Button>
            <Button variant="ghost" size="icon" onClick={() => videoRef.current && (videoRef.current.currentTime -= 10)} className="h-8 w-8 sm:h-9 sm:w-9 text-white hover:bg-white/20">
              <SkipBack className="h-4 w-4 sm:h-5 sm:w-5" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => videoRef.current && (videoRef.current.currentTime += 10)} className="h-8 w-8 sm:h-9 sm:w-9 text-white hover:bg-white/20">
              <SkipForward className="h-4 w-4 sm:h-5 sm:w-5" />
            </Button>
            <div className="hidden sm:flex items-center gap-2 group/volume">
              <Button variant="ghost" size="icon" onClick={toggleMute} className="h-9 w-9 text-white hover:bg-white/20">
                {isMuted || volume === 0 ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
              </Button>
              <input
                type="range"
                min={0}
                max={1}
                step={0.1}
                value={isMuted ? 0 : volume}
                onChange={(e) => {
                  const v = parseFloat(e.target.value);
                  setVolume(v);
                  if (videoRef.current) videoRef.current.volume = v;
                }}
                className="w-0 group-hover/volume:w-20 transition-all h-1 appearance-none bg-white/30 rounded-full cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white"
              />
            </div>
            <span className="text-xs sm:text-sm text-white/80 ml-1 sm:ml-2 whitespace-nowrap">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>

          <div className="flex items-center gap-0.5 sm:gap-2 flex-shrink-0">
            {source && (
              <span className="hidden lg:inline text-xs text-white/60 mr-2">
                {source.addonName} • {source.quality}
              </span>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 sm:h-9 sm:w-9 text-white hover:bg-white/20">
                  <Settings className="h-4 w-4 sm:h-5 sm:w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuLabel>Скорость</DropdownMenuLabel>
                {playbackRates.map((rate) => (
                  <DropdownMenuItem
                    key={rate}
                    onClick={() => {
                      setPlaybackRate(rate);
                      if (videoRef.current) videoRef.current.playbackRate = rate;
                    }}
                    className={playbackRate === rate ? 'bg-primary/20' : ''}
                  >
                    {rate}x
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            <Button variant="ghost" size="icon" onClick={toggleFullscreen} className="h-8 w-8 sm:h-9 sm:w-9 text-white hover:bg-white/20">
              {isFullscreen ? <Minimize className="h-4 w-4 sm:h-5 sm:w-5" /> : <Maximize className="h-4 w-4 sm:h-5 sm:w-5" />}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
