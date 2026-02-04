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
  Monitor,
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

interface VideoStream {
  url: string;
  quality: string;
  translation: string;
  source: string;
}

interface PlayerInfo {
  type: string;
  iframeUrl: string;
  translation: string;
  quality: string;
}

interface Translation {
  id: string | number | null;
  name: string;
  quality: string;
  source: string;
}

interface HlsLevel {
  height: number;
  width: number;
  bitrate: number;
}

interface MoviePlayerProps {
  streams: VideoStream[];
  players: PlayerInfo[];
  translations?: Translation[];
  kinopoiskId?: number;
  season?: number;
  episode?: number;
  poster?: string;
  movieTitle?: string;
  isLoading?: boolean;
}

const playbackRates = [0.5, 0.75, 1, 1.25, 1.5, 2];

export function MoviePlayer({
  streams,
  players,
  translations = [],
  kinopoiskId,
  season,
  episode,
  poster,
  movieTitle,
  isLoading: externalLoading,
}: MoviePlayerProps) {
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
  const [currentStreamIndex, setCurrentStreamIndex] = useState(0);
  const [useIframe, setUseIframe] = useState(false);
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);
  const [qualityLevels, setQualityLevels] = useState<HlsLevel[]>([]);
  const [currentQuality, setCurrentQuality] = useState(-1); // -1 = auto
  const [loadingTranslation, setLoadingTranslation] = useState(false);
  const [currentTranslationName, setCurrentTranslationName] = useState<string | null>(null);

  const { volume, playbackRate, setVolume, setPlaybackRate } = usePlayerStore();

  const currentStream = streams[currentStreamIndex];

  const isPlayingRef = useRef(false);
  isPlayingRef.current = isPlaying;

  const initVideo = useCallback((url: string) => {
    if (!videoRef.current) return;

    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    const video = videoRef.current;
    setQualityLevels([]);
    setCurrentQuality(-1);

    if (url.includes('.m3u8') && Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
      });

      hls.loadSource(url);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, (_, data) => {
        setIsLoading(false);
        // Capture available quality levels
        if (data.levels && data.levels.length > 0) {
          setQualityLevels(data.levels.map((l: { height: number; width: number; bitrate: number }) => ({
            height: l.height,
            width: l.width,
            bitrate: l.bitrate,
          })));
        }
        if (isPlayingRef.current) {
          video.play();
        }
      });

      hls.on(Hls.Events.LEVEL_SWITCHED, (_, data) => {
        setCurrentQuality(data.level);
      });

      hls.on(Hls.Events.ERROR, (_, data) => {
        if (data.fatal) {
          console.error('HLS error:', data);
          setIsLoading(false);
          // Try iframe fallback on error
          if (players.length > 0) {
            setUseIframe(true);
          }
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
  }, [players.length]);

  useEffect(() => {
    if (currentStream && !useIframe) {
      setIsLoading(true);
      initVideo(currentStream.url);
      // Set initial translation name from stream
      if (!currentTranslationName && currentStream.translation) {
        setCurrentTranslationName(currentStream.translation);
      }
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [currentStream, initVideo, useIframe, currentTranslationName]);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.volume = volume;
      videoRef.current.playbackRate = playbackRate;
    }
  }, [volume, playbackRate]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(
        !!document.fullscreenElement || !!(document as any).webkitFullscreenElement
      );
    };

    const handleIOSFullscreenBegin = () => setIsFullscreen(true);
    const handleIOSFullscreenEnd = () => setIsFullscreen(false);

    const video = videoRef.current;

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);

    if (video) {
      video.addEventListener('webkitbeginfullscreen', handleIOSFullscreenBegin);
      video.addEventListener('webkitendfullscreen', handleIOSFullscreenEnd);
    }

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      if (video) {
        video.removeEventListener('webkitbeginfullscreen', handleIOSFullscreenBegin);
        video.removeEventListener('webkitendfullscreen', handleIOSFullscreenEnd);
      }
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

    const handleTouchStart = () => {
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
      container.addEventListener('touchstart', handleTouchStart);
      container.addEventListener('mouseleave', () => {
        if (isPlaying) setShowControls(false);
      });
    }

    return () => {
      if (container) {
        container.removeEventListener('mousemove', handleMouseMove);
        container.removeEventListener('touchstart', handleTouchStart);
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
    const video = videoRef.current;
    const container = containerRef.current;
    if (!container || !video) return;

    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) ||
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

    if (isFullscreen) {
      if (document.exitFullscreen) {
        await document.exitFullscreen();
      } else if ((document as any).webkitExitFullscreen) {
        (document as any).webkitExitFullscreen();
      }
    } else {
      if (isIOS && (video as any).webkitEnterFullscreen) {
        (video as any).webkitEnterFullscreen();
      } else if (container.requestFullscreen) {
        await container.requestFullscreen();
      } else if ((container as any).webkitRequestFullscreen) {
        (container as any).webkitRequestFullscreen();
      }
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

  // Change quality level
  const changeQuality = (levelIndex: number) => {
    if (hlsRef.current) {
      hlsRef.current.currentLevel = levelIndex; // -1 for auto
      setCurrentQuality(levelIndex);
    }
  };

  // Load a specific translation (audio track)
  const loadTranslation = async (translation: Translation, index: number) => {
    if (!kinopoiskId) {
      console.error('Missing kinopoiskId');
      return;
    }

    setLoadingTranslation(true);
    try {
      // Save current playback position and playing state
      const currentPos = videoRef.current?.currentTime || 0;
      const wasPlaying = isPlayingRef.current;

      // Use audio parameter with index
      let url = `/api/kinobox/stream?kp=${kinopoiskId}&audio=${index}`;
      if (season !== undefined) url += `&season=${season}`;
      if (episode !== undefined) url += `&episode=${episode}`;

      const response = await fetch(url);

      if (!response.ok) {
        console.error('Failed to fetch translation stream:', response.status);
        return;
      }

      const data = await response.json();

      // Get first stream from streams array
      if (data.streams?.[0]?.url) {
        // Load new stream
        initVideo(data.streams[0].url);
        setCurrentTranslationName(translation.name);

        // Restore position and play state after video loads
        const handleCanPlay = () => {
          if (videoRef.current) {
            if (currentPos > 0) {
              videoRef.current.currentTime = currentPos;
            }
            if (wasPlaying) {
              videoRef.current.play();
            }
            videoRef.current.removeEventListener('canplay', handleCanPlay);
          }
        };

        if (videoRef.current) {
          videoRef.current.addEventListener('canplay', handleCanPlay);
        }
      } else {
        console.error('No stream URL in response:', data);
      }
    } catch (error) {
      console.error('Failed to load translation:', error);
    } finally {
      setLoadingTranslation(false);
    }
  };

  // Format quality label
  const getQualityLabel = (level: HlsLevel, index: number) => {
    if (level.height) {
      return `${level.height}p`;
    }
    return `Качество ${index + 1}`;
  };

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!videoRef.current) return;

      // Don't handle if focus is on an input
      if (document.activeElement?.tagName === 'INPUT') return;

      switch (e.key) {
        case 'ArrowLeft':
          e.preventDefault();
          skip(-10);
          break;
        case 'ArrowRight':
          e.preventDefault();
          skip(10);
          break;
        case 'ArrowUp':
          e.preventDefault();
          setVolume(Math.min(1, volume + 0.1));
          break;
        case 'ArrowDown':
          e.preventDefault();
          setVolume(Math.max(0, volume - 0.1));
          break;
        case ' ':
          e.preventDefault();
          togglePlay();
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
  }, [volume, setVolume, duration]);

  // Loading state
  if (externalLoading) {
    return (
      <div
        ref={containerRef}
        className="video-player-container flex items-center justify-center bg-black"
      >
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  // If using iframe player
  if (useIframe && players.length > 0) {
    const currentPlayer = players[currentPlayerIndex];
    return (
      <div ref={containerRef} className="video-player-container relative">
        <iframe
          src={currentPlayer.iframeUrl}
          className="w-full h-full"
          allowFullScreen
          allow="autoplay; fullscreen"
          style={{ border: 'none' }}
        />
        {/* Player selector */}
        {players.length > 1 && (
          <div className="absolute top-2 right-2 z-10">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="secondary" size="sm" className="bg-black/70 hover:bg-black/90">
                  <Monitor className="h-4 w-4 mr-2" />
                  {currentPlayer.type}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Плеер</DropdownMenuLabel>
                {players.map((player, index) => (
                  <DropdownMenuItem
                    key={index}
                    onClick={() => setCurrentPlayerIndex(index)}
                    className={currentPlayerIndex === index ? 'bg-primary/20' : ''}
                  >
                    {player.type} - {player.translation}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </div>
    );
  }

  // No streams or players available
  if (streams.length === 0 && players.length === 0) {
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
              {movieTitle || 'Фильм'}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Видео недоступно
            </p>
          </div>
        </div>
      </div>
    );
  }

  // If no direct streams but have iframe players, use them
  if (streams.length === 0 && players.length > 0) {
    setUseIframe(true);
    return null;
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
          }
        }}
        onWaiting={() => setIsLoading(true)}
        onCanPlay={() => setIsLoading(false)}
        onError={() => {
          // Try iframe fallback on error
          if (players.length > 0) {
            setUseIframe(true);
          }
        }}
        playsInline
      />

      {(isLoading || loadingTranslation) && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50">
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            {loadingTranslation && (
              <span className="text-sm text-white/80">Загрузка озвучки...</span>
            )}
          </div>
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
        className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent p-2 sm:p-4 transition-opacity duration-300 ${
          showControls ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <div className="relative mb-2 sm:mb-3">
          <input
            type="range"
            min={0}
            max={duration || 100}
            value={currentTime}
            onChange={handleSeek}
            className="w-full h-1 appearance-none bg-white/30 rounded-full cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary"
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

        <div className="flex items-center justify-between gap-1">
          {/* Left controls - main playback */}
          <div className="flex items-center gap-0.5 sm:gap-2 flex-shrink-0">
            <Button
              variant="ghost"
              size="icon"
              onClick={togglePlay}
              className="h-8 w-8 sm:h-9 sm:w-9 text-white hover:bg-white/20"
            >
              {isPlaying ? (
                <Pause className="h-4 w-4 sm:h-5 sm:w-5" />
              ) : (
                <Play className="h-4 w-4 sm:h-5 sm:w-5 fill-current" />
              )}
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => skip(-10)}
              className="h-8 w-8 sm:h-9 sm:w-9 text-white hover:bg-white/20"
            >
              <SkipBack className="h-4 w-4 sm:h-5 sm:w-5" />
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => skip(10)}
              className="h-8 w-8 sm:h-9 sm:w-9 text-white hover:bg-white/20"
            >
              <SkipForward className="h-4 w-4 sm:h-5 sm:w-5" />
            </Button>

            {/* Volume - hidden on mobile */}
            <div className="hidden sm:flex items-center gap-2 group/volume">
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

            <span className="text-xs sm:text-sm text-white/80 ml-1 sm:ml-2 whitespace-nowrap">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>

          {/* Right controls */}
          <div className="flex items-center gap-0.5 sm:gap-2 flex-shrink-0">
            {/* Source info - hidden on mobile */}
            {currentStream && (
              <span className="hidden lg:inline text-xs text-white/60 mr-2">
                {currentStream.source} • {currentStream.translation}
                {qualityLevels.length > 0 && currentQuality >= 0 && (
                  <> • {getQualityLabel(qualityLevels[currentQuality], currentQuality)}</>
                )}
                {qualityLevels.length > 0 && currentQuality === -1 && ' • Авто'}
              </span>
            )}

            {/* Switch to iframe player - hidden on small screens */}
            {players.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setUseIframe(true)}
                className="hidden md:flex h-8 sm:h-9 text-white hover:bg-white/20 text-xs px-2"
                title="Внешний плеер с лучшим качеством (4K)"
              >
                <Monitor className="h-4 w-4 sm:mr-1" />
                <span className="hidden sm:inline">4K</span>
              </Button>
            )}

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 sm:h-9 sm:w-9 text-white hover:bg-white/20"
                >
                  <Settings className="h-4 w-4 sm:h-5 sm:w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 max-h-80 overflow-y-auto">
                {/* Quality selection */}
                {qualityLevels.length > 0 && (
                  <>
                    <DropdownMenuLabel>Качество</DropdownMenuLabel>
                    <DropdownMenuItem
                      onClick={() => changeQuality(-1)}
                      className={currentQuality === -1 ? 'bg-primary/20' : ''}
                    >
                      Авто
                    </DropdownMenuItem>
                    {qualityLevels.map((level, index) => (
                      <DropdownMenuItem
                        key={index}
                        onClick={() => changeQuality(index)}
                        className={currentQuality === index ? 'bg-primary/20' : ''}
                      >
                        {getQualityLabel(level, index)}
                      </DropdownMenuItem>
                    ))}
                    {qualityLevels.every(l => l.height < 1080) && players.length > 0 && (
                      <DropdownMenuItem
                        onClick={() => setUseIframe(true)}
                        className="text-primary"
                      >
                        4K в плеере
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                  </>
                )}

                {/* 4K Player option for mobile (since button is hidden) */}
                {players.length > 0 && (
                  <>
                    <DropdownMenuItem
                      onClick={() => setUseIframe(true)}
                      className="md:hidden"
                    >
                      <Monitor className="h-4 w-4 mr-2" />
                      4K Плеер
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className="md:hidden" />
                  </>
                )}

                {/* Translation selection */}
                {translations.length > 0 && (
                  <>
                    <DropdownMenuLabel>Озвучка</DropdownMenuLabel>
                    {translations.map((translation, index) => (
                      <DropdownMenuItem
                        key={index}
                        onClick={() => loadTranslation(translation, index)}
                        disabled={loadingTranslation}
                        className={currentTranslationName === translation.name ? 'bg-primary/20' : ''}
                      >
                        {translation.name}
                        <span className="ml-auto text-xs text-muted-foreground">
                          {translation.quality}
                        </span>
                      </DropdownMenuItem>
                    ))}
                    <DropdownMenuSeparator />
                  </>
                )}

                {/* Playback speed */}
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

                {streams.length > 1 && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuLabel>Источник</DropdownMenuLabel>
                    {streams.map((stream, index) => (
                      <DropdownMenuItem
                        key={index}
                        onClick={() => setCurrentStreamIndex(index)}
                        className={currentStreamIndex === index ? 'bg-primary/20' : ''}
                      >
                        {stream.source} - {stream.translation}
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
              className="h-8 w-8 sm:h-9 sm:w-9 text-white hover:bg-white/20"
            >
              {isFullscreen ? (
                <Minimize className="h-4 w-4 sm:h-5 sm:w-5" />
              ) : (
                <Maximize className="h-4 w-4 sm:h-5 sm:w-5" />
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
