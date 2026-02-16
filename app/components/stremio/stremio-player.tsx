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
  Magnet,
  Copy,
  Check,
  HardDrive,
  Info,
  Server,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useStremioStore } from '@/lib/store/stremio-store';
import { resolveTorrentStream, dropTorrent } from '@/lib/api/stremio';
import type { StreamSource } from '@/types/stremio';

const playbackRates = [0.5, 0.75, 1, 1.25, 1.5, 2];

function TorrentPanel({
  source,
  poster,
  title,
  onResolved,
}: {
  source: StreamSource;
  poster?: string;
  title?: string;
  onResolved: (url: string) => void;
}) {
  const { torrServerUrl } = useStremioStore();
  const [resolving, setResolving] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const magnetUrl = source.url;

  // Auto-resolve if TorrServer is configured
  useEffect(() => {
    if (torrServerUrl && source.infoHash) {
      handleResolve();
    }
  }, [source.infoHash, torrServerUrl]);

  const handleResolve = async () => {
    if (!torrServerUrl) return;
    setResolving(true);
    setError('');

    try {
      const result = await resolveTorrentStream(
        torrServerUrl,
        magnetUrl,
        title,
        poster
      );
      onResolved(result.streamUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось подключиться к TorrServer');
      setResolving(false);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(magnetUrl);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = magnetUrl;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="video-player-container relative flex flex-col items-center justify-center bg-card">
      <div
        className="absolute inset-0 bg-cover bg-center opacity-10"
        style={{ backgroundImage: poster ? `url(${poster})` : undefined }}
      />
      <div className="relative z-10 text-center space-y-4 p-6 max-w-md">
        {resolving ? (
          <>
            <Loader2 className="h-12 w-12 mx-auto text-primary animate-spin" />
            <div>
              <p className="text-foreground font-semibold">Загрузка через TorrServer...</p>
              <p className="text-sm text-muted-foreground mt-1">Подготовка стрима</p>
            </div>
          </>
        ) : (
          <>
            <Magnet className="h-12 w-12 mx-auto text-amber-400" />
            <div>
              <p className="text-foreground font-semibold text-lg">Торрент-стрим</p>
              {!torrServerUrl && (
                <p className="text-sm text-muted-foreground mt-1">
                  Для воспроизведения настройте TorrServer или Debrid
                </p>
              )}
            </div>
          </>
        )}

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-sm text-red-400">
            {error}
          </div>
        )}

        {/* Stream info */}
        <div className="space-y-2 text-left bg-background/50 rounded-lg p-3 border border-border">
          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">Аддон:</span>
            <span className="font-medium">{source.addonName}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">Качество:</span>
            <span className="font-medium">{source.quality}</span>
          </div>
          {source.size && (
            <div className="flex items-center gap-2 text-sm">
              <HardDrive className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="font-medium">{source.size}</span>
            </div>
          )}
          {source.title && (
            <p className="text-xs text-muted-foreground break-all line-clamp-2 pt-1 border-t border-border">
              {source.title}
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-2">
          {torrServerUrl && !resolving && (
            <Button onClick={handleResolve} className="gap-2">
              <Server className="h-4 w-4" />
              Воспроизвести через TorrServer
            </Button>
          )}
          <Button onClick={handleCopy} variant="outline" className="gap-2">
            {copied ? <Check className="h-4 w-4 text-green-400" /> : <Copy className="h-4 w-4" />}
            {copied ? 'Скопировано!' : 'Копировать magnet-ссылку'}
          </Button>
        </div>

        {/* Hints */}
        {!torrServerUrl && (
          <div className="flex items-start gap-2 text-left bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
            <Info className="h-4 w-4 text-blue-400 mt-0.5 shrink-0" />
            <div className="text-xs text-blue-200/80 space-y-1">
              <p><strong>TorrServer</strong> — запустите локально или на VPS, укажите URL в настройках аддонов. Торренты будут воспроизводиться в плеере.</p>
              <p><strong>Debrid</strong> — настройте Torrentio с Real-Debrid, и торренты станут прямыми ссылками.</p>
            </div>
          </div>
        )}
      </div>
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
  const [resolvedTorrentUrl, setResolvedTorrentUrl] = useState<string | null>(null);

  // Reset resolved URL when source changes
  useEffect(() => {
    setResolvedTorrentUrl(null);
  }, [source?.url]);

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
    const url = resolvedTorrentUrl || (source && !source.isTorrent ? source.url : null);
    if (url) {
      setIsLoading(true);
      initVideo(url);
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [source?.url, resolvedTorrentUrl, initVideo]);

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

  // Torrent stream — resolve via TorrServer or show info panel
  if (source.isTorrent && !resolvedTorrentUrl) {
    return (
      <TorrentPanel
        source={source}
        poster={poster}
        title={title}
        onResolved={setResolvedTorrentUrl}
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
