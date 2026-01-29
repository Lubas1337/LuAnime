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
  Settings,
  SkipForward,
  SkipBack,
  Loader2,
  ExternalLink,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { usePlayerStore } from '@/lib/store/player-store';
import { parseKodikUrl } from '@/lib/api/kodik';
import type { VideoSource } from '@/types/anime';

interface VideoPlayerProps {
  sources: VideoSource[];
  embedUrl?: string;
  poster?: string;
  animeTitle?: string;
  episodeNumber?: number;
  startTime?: number;
  onEnded?: () => void;
  onProgress?: (progress: number, currentTime: number) => void;
}

const playbackRates = [0.5, 0.75, 1, 1.25, 1.5, 2];

export function VideoPlayer({
  sources,
  embedUrl,
  poster,
  animeTitle,
  episodeNumber,
  startTime,
  onEnded,
  onProgress,
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const hlsRef = useRef<Hls | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showControls, setShowControls] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [buffered, setBuffered] = useState(0);

  const { volume, playbackRate, setVolume, setPlaybackRate } =
    usePlayerStore();

  const [kodikSources, setKodikSources] = useState<VideoSource[]>([]);
  const [kodikParsing, setKodikParsing] = useState(false);
  const [kodikFailed, setKodikFailed] = useState(false);

  // Merge original sources with kodik-parsed sources
  const allSources = kodikSources.length > 0 ? kodikSources : sources;
  const [currentSourceIndex, setCurrentSourceIndex] = useState(0);
  const currentSource = allSources[currentSourceIndex];

  // Reset kodik state when embed URL changes (new episode)
  useEffect(() => {
    setKodikSources([]);
    setKodikFailed(false);
    setCurrentSourceIndex(0);
  }, [embedUrl]);

  const isPlayingRef = useRef(false);
  isPlayingRef.current = isPlaying;

  const initHls = useCallback(
    (source: VideoSource) => {
      if (!videoRef.current) return;

      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }

      const video = videoRef.current;

      if (source.url.includes('.m3u8') && Hls.isSupported()) {
        const hls = new Hls({
          enableWorker: true,
          lowLatencyMode: true,
        });

        hls.loadSource(source.url);
        hls.attachMedia(video);

        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          setIsLoading(false);
          if (isPlayingRef.current) {
            video.play();
          }
        });

        hls.on(Hls.Events.ERROR, (_, data) => {
          if (data.fatal) {
            console.error('HLS error:', data);
            setIsLoading(false);
          }
        });

        hlsRef.current = hls;
      } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = source.url;
        setIsLoading(false);
      } else {
        video.src = source.url;
        setIsLoading(false);
      }
    },
    [] // no deps — uses ref for isPlaying
  );

  useEffect(() => {
    if (currentSource) {
      setIsLoading(true);
      initHls(currentSource);
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [currentSource, initHls]);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.volume = volume;
      videoRef.current.playbackRate = playbackRate;
    }
  }, [volume, playbackRate]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  useEffect(() => {
    let hideTimeout: NodeJS.Timeout;

    const handleMouseMove = () => {
      setShowControls(true);
      clearTimeout(hideTimeout);
      if (isPlaying) {
        hideTimeout = setTimeout(() => setShowControls(false), 3000);
      }
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener('mousemove', handleMouseMove);
      container.addEventListener('mouseenter', handleMouseMove);
      container.addEventListener('mouseleave', () => {
        if (isPlaying) setShowControls(false);
      });
    }

    return () => {
      if (container) {
        container.removeEventListener('mousemove', handleMouseMove);
      }
      clearTimeout(hideTimeout);
    };
  }, [isPlaying]);

  const togglePlay = () => {
    if (!videoRef.current) return;

    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
    }
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const toggleFullscreen = async () => {
    if (!containerRef.current) return;

    if (isFullscreen) {
      await document.exitFullscreen();
    } else {
      await containerRef.current.requestFullscreen();
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    setVolume(value);
    if (videoRef.current) {
      videoRef.current.volume = value;
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const skip = (seconds: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = Math.max(
        0,
        Math.min(duration, videoRef.current.currentTime + seconds)
      );
    }
  };

  const formatTime = (time: number) => {
    const hours = Math.floor(time / 3600);
    const minutes = Math.floor((time % 3600) / 60);
    const seconds = Math.floor(time % 60);

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
      onProgress?.(
        videoRef.current.currentTime / videoRef.current.duration,
        videoRef.current.currentTime
      );
    }
  };

  const handleProgress = () => {
    if (videoRef.current && videoRef.current.buffered.length > 0) {
      const bufferedEnd = videoRef.current.buffered.end(
        videoRef.current.buffered.length - 1
      );
      setBuffered(bufferedEnd);
    }
  };

  // Try to parse Kodik embed URL into direct video sources
  useEffect(() => {
    if (!embedUrl || kodikSources.length > 0 || kodikFailed) return;

    const isKodik =
      embedUrl.includes('kodik.') ||
      embedUrl.includes('aniqit.') ||
      embedUrl.includes('kodik.info');

    if (!isKodik) return;

    let cancelled = false;

    setKodikParsing(true);
    parseKodikUrl(embedUrl)
      .then((parsed) => {
        if (cancelled) return;
        if (parsed.length > 0) {
          setKodikSources(parsed);
          setCurrentSourceIndex(0);
        } else {
          setKodikFailed(true);
        }
      })
      .catch((err) => {
        if (cancelled) return;
        if (err?.name === 'AbortError') return;
        setKodikFailed(true);
      })
      .finally(() => {
        if (!cancelled) {
          setKodikParsing(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [embedUrl, kodikSources.length, kodikFailed]);

  // If embed URL is provided and kodik parsing is in progress, show loading
  if (embedUrl && kodikParsing) {
    return (
      <div
        ref={containerRef}
        className="video-player-container flex items-center justify-center bg-black"
      >
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  // If embed URL is provided and kodik failed (or not a kodik URL), show iframe player
  if (embedUrl && kodikSources.length === 0) {
    return (
      <div
        ref={containerRef}
        className="video-player-container"
      >
        <iframe
          src={embedUrl}
          className="w-full h-full"
          allowFullScreen
          allow="autoplay; fullscreen"
          style={{ border: 'none' }}
        />
      </div>
    );
  }

  // If no sources, show external search options
  if (allSources.length === 0) {
    const searchQuery = encodeURIComponent(
      `${animeTitle || 'anime'} ${episodeNumber ? `серия ${episodeNumber}` : ''}`
    );

    return (
      <div className="video-player-container flex flex-col items-center justify-center bg-card gap-4">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-20"
          style={{ backgroundImage: poster ? `url(${poster})` : undefined }}
        />
        <div className="relative z-10 text-center space-y-4 p-4">
          <Play className="h-12 w-12 mx-auto text-primary opacity-70" />
          <div>
            <p className="text-foreground font-medium">
              Серия {episodeNumber}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Смотреть на внешних плеерах
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 justify-center">
            <Button
              variant="default"
              size="sm"
              onClick={() => window.open(`https://animego.org/search/all?q=${encodeURIComponent(animeTitle || '')}`, '_blank')}
              className="gap-2"
            >
              <ExternalLink className="h-4 w-4" />
              AnimeGo
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open(`https://jut.su/anime/?search=${encodeURIComponent(animeTitle || '')}`, '_blank')}
              className="gap-2"
            >
              <ExternalLink className="h-4 w-4" />
              JUT.SU
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open(`https://animevost.org/search?q=${encodeURIComponent(animeTitle || '')}`, '_blank')}
              className="gap-2"
            >
              <ExternalLink className="h-4 w-4" />
              AnimeVost
            </Button>
          </div>
        </div>
      </div>
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
        onTimeUpdate={handleTimeUpdate}
        onProgress={handleProgress}
        onLoadedMetadata={() => {
          if (videoRef.current) {
            setDuration(videoRef.current.duration);
            if (startTime && startTime > 0 && startTime < videoRef.current.duration) {
              videoRef.current.currentTime = startTime;
              setCurrentTime(startTime);
            }
          }
        }}
        onWaiting={() => setIsLoading(true)}
        onCanPlay={() => setIsLoading(false)}
        onEnded={onEnded}
        playsInline
      />

      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
      )}

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

      <div
        className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent p-4 transition-opacity duration-300 ${
          showControls ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <div className="relative mb-3">
          <input
            type="range"
            min={0}
            max={duration || 100}
            value={currentTime}
            onChange={handleSeek}
            className="w-full h-1 appearance-none bg-white/30 rounded-full cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary"
          />
          <div
            className="absolute top-0 left-0 h-1 bg-white/50 rounded-full pointer-events-none"
            style={{ width: `${(buffered / duration) * 100}%` }}
          />
          <div
            className="absolute top-0 left-0 h-1 bg-primary rounded-full pointer-events-none"
            style={{ width: `${(currentTime / duration) * 100}%` }}
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={togglePlay}
              className="h-9 w-9 text-white hover:bg-white/20"
            >
              {isPlaying ? (
                <Pause className="h-5 w-5" />
              ) : (
                <Play className="h-5 w-5 fill-current" />
              )}
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => skip(-10)}
              className="h-9 w-9 text-white hover:bg-white/20"
            >
              <SkipBack className="h-5 w-5" />
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => skip(10)}
              className="h-9 w-9 text-white hover:bg-white/20"
            >
              <SkipForward className="h-5 w-5" />
            </Button>

            <div className="flex items-center gap-2 group/volume">
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleMute}
                className="h-9 w-9 text-white hover:bg-white/20"
              >
                {isMuted || volume === 0 ? (
                  <VolumeX className="h-5 w-5" />
                ) : (
                  <Volume2 className="h-5 w-5" />
                )}
              </Button>
              <input
                type="range"
                min={0}
                max={1}
                step={0.1}
                value={isMuted ? 0 : volume}
                onChange={handleVolumeChange}
                className="w-0 group-hover/volume:w-20 transition-all h-1 appearance-none bg-white/30 rounded-full cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white"
              />
            </div>

            <span className="text-sm text-white/80 ml-2">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 text-white hover:bg-white/20"
                >
                  <Settings className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuLabel>Скорость</DropdownMenuLabel>
                {playbackRates.map((rate) => (
                  <DropdownMenuItem
                    key={rate}
                    onClick={() => setPlaybackRate(rate)}
                    className={playbackRate === rate ? 'bg-primary/20' : ''}
                  >
                    {rate}x
                  </DropdownMenuItem>
                ))}

                {allSources.length > 1 && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuLabel>Качество</DropdownMenuLabel>
                    {allSources.map((source, index) => (
                      <DropdownMenuItem
                        key={index}
                        onClick={() => setCurrentSourceIndex(index)}
                        className={currentSourceIndex === index ? 'bg-primary/20' : ''}
                      >
                        {source.quality}
                      </DropdownMenuItem>
                    ))}
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>

            <Button
              variant="ghost"
              size="icon"
              onClick={toggleFullscreen}
              className="h-9 w-9 text-white hover:bg-white/20"
            >
              {isFullscreen ? (
                <Minimize className="h-5 w-5" />
              ) : (
                <Maximize className="h-5 w-5" />
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
