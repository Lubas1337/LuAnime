declare module 'mux.js' {
  interface TransmuxerSegment {
    initSegment: Uint8Array;
    data: Uint8Array;
  }

  interface Transmuxer {
    on(event: 'data', callback: (segment: TransmuxerSegment) => void): void;
    on(event: 'done', callback: () => void): void;
    push(data: Uint8Array): void;
    flush(): void;
    reset(): void;
  }

  interface TransmuxerConstructor {
    new (): Transmuxer;
  }

  const muxjs: {
    mp4: {
      Transmuxer: TransmuxerConstructor;
    };
  };

  export default muxjs;
}
