//
//  KodikVideoPlayer.swift
//  mobile
//
//  LuAnime iOS App - Episode Video Player
//  Embedded preview with fullscreen AVPlayerViewController
//

import SwiftUI
import AVKit

// MARK: - EpisodePlayerView (Embedded Preview)

/// Displays a poster thumbnail with a Play button. Tapping Play opens native
/// AVPlayerViewController in fullscreen. The AVPlayer is created only when
/// entering fullscreen and destroyed on exit to avoid memory leaks.
struct EpisodePlayerView: View {
    let anime: Anime
    let episode: Episode
    @Binding var selectedQuality: String
    @Binding var availableQualities: [KodikVideoLink]

    @State private var isLoading = true
    @State private var error: String?
    @State private var showFullscreen = false
    @State private var resolvedURL: URL?
    @State private var savedSeekTime: Double = 0

    private let playerStore = PlayerStore.shared

    private var episodeURL: String? {
        guard let url = episode.url, !url.isEmpty else { return nil }
        return url
    }

    private var isKodik: Bool {
        guard let url = episodeURL else { return false }
        return episode.isIframe && Self.isKodikURL(url)
    }

    var body: some View {
        ZStack {
            Color.black

            if isLoading {
                loadingView
            } else if let errorMessage = error {
                errorView(message: errorMessage)
            } else {
                thumbnailWithPlayButton
            }
        }
        .aspectRatio(16/9, contentMode: .fit)
        .clipShape(RoundedRectangle(cornerRadius: 12))
        .task { await resolveVideoURL() }
        .onChange(of: selectedQuality) { _, newQuality in
            handleQualityChange(newQuality)
        }
        .fullScreenCover(isPresented: $showFullscreen) {
            if let url = resolvedURL {
                FullscreenPlayerView(
                    url: url,
                    startTime: savedSeekTime,
                    anime: anime,
                    episode: episode,
                    onTimeUpdate: { savedSeekTime = $0 },
                    onDismiss: { showFullscreen = false }
                )
                .ignoresSafeArea()
            }
        }
    }

    // MARK: - Subviews

    private var loadingView: some View {
        VStack(spacing: 12) {
            ProgressView()
                .progressViewStyle(CircularProgressViewStyle(tint: .white))
            Text("Loading...")
                .font(.caption)
                .foregroundStyle(.white.opacity(0.7))
        }
    }

    private func errorView(message: String) -> some View {
        VStack(spacing: 12) {
            Image(systemName: "exclamationmark.triangle.fill")
                .font(.title)
                .foregroundStyle(.orange)

            Text(message)
                .font(.caption)
                .foregroundStyle(.white.opacity(0.7))
                .multilineTextAlignment(.center)
                .padding(.horizontal)

            Button("Retry") {
                Task { await resolveVideoURL() }
            }
            .font(.caption)
            .buttonStyle(.bordered)
            .tint(.white)
        }
    }

    private var thumbnailWithPlayButton: some View {
        ZStack {
            // Poster background
            if let posterURL = anime.posterURL {
                AsyncImage(url: posterURL) { phase in
                    switch phase {
                    case .success(let image):
                        image
                            .resizable()
                            .aspectRatio(contentMode: .fill)
                    case .failure:
                        Color.black
                    default:
                        Color.black
                    }
                }
            }

            // Dark overlay for readability
            Color.black.opacity(0.4)

            // Play button + resume label
            VStack(spacing: 8) {
                Button {
                    showFullscreen = true
                } label: {
                    Image(systemName: "play.fill")
                        .font(.system(size: 36))
                        .foregroundStyle(.white)
                        .padding(20)
                        .background(Circle().fill(.ultraThinMaterial))
                }

                if savedSeekTime > 1 {
                    Text("Resume from \(Self.formatTime(savedSeekTime))")
                        .font(.caption)
                        .foregroundStyle(.white.opacity(0.8))
                        .padding(.horizontal, 12)
                        .padding(.vertical, 4)
                        .background(Capsule().fill(.black.opacity(0.6)))
                }
            }
        }
    }

    // MARK: - Video URL Resolution

    private func resolveVideoURL() async {
        isLoading = true
        error = nil

        guard let url = episodeURL else {
            error = "No video source available"
            isLoading = false
            return
        }

        // Restore saved progress
        if let savedProgress = playerStore.getProgress(animeId: anime.id, episodeNumber: episode.episodeNumber),
           savedProgress > 0.01 && savedProgress < 0.95 {
            // We don't know duration yet, store as fraction — will convert in FullscreenPlayerView
            // For now keep savedSeekTime = 0; actual seek handled after player reports duration
            // unless we already have a non-zero savedSeekTime from a previous fullscreen session
            if savedSeekTime < 1 {
                savedSeekTime = -savedProgress // negative = fraction, positive = absolute seconds
            }
        }

        if isKodik {
            do {
                let links = try await KodikParser.shared.extractVideoLinks(from: url)
                await MainActor.run {
                    availableQualities = links
                    if let preferred = links.first(where: { $0.quality == selectedQuality }) {
                        resolvedURL = preferred.url
                    } else if let preferred = links.first(where: { $0.quality == "720" }) {
                        selectedQuality = preferred.quality
                        resolvedURL = preferred.url
                    } else if let best = links.first {
                        selectedQuality = best.quality
                        resolvedURL = best.url
                    }
                    isLoading = false
                }
            } catch {
                await MainActor.run {
                    self.error = error.localizedDescription
                    isLoading = false
                }
            }
        } else {
            // Direct URL
            if let directURL = URL(string: url) {
                resolvedURL = directURL
                isLoading = false
            } else {
                error = "Invalid video URL"
                isLoading = false
            }
        }
    }

    private func handleQualityChange(_ quality: String) {
        guard let link = availableQualities.first(where: { $0.quality == quality }),
              link.url != resolvedURL else { return }
        resolvedURL = link.url
    }

    // MARK: - Helpers

    static func isKodikURL(_ url: String) -> Bool {
        let kodikHosts = ["kodik.info", "kodik.cc", "kodik.biz", "aniqit.com", "kodik.top"]
        return kodikHosts.contains { url.contains($0) }
    }

    static func formatTime(_ seconds: Double) -> String {
        let totalSeconds = Int(abs(seconds))
        let minutes = totalSeconds / 60
        let secs = totalSeconds % 60
        return String(format: "%d:%02d", minutes, secs)
    }
}

// MARK: - FullscreenPlayerView (AVPlayerViewController with Coordinator)

struct FullscreenPlayerView: UIViewControllerRepresentable {
    let url: URL
    let startTime: Double
    let anime: Anime
    let episode: Episode
    let onTimeUpdate: (Double) -> Void
    let onDismiss: () -> Void

    func makeCoordinator() -> Coordinator {
        Coordinator(parent: self)
    }

    func makeUIViewController(context: Context) -> AVPlayerViewController {
        let player = AVPlayer(url: url)
        let vc = AVPlayerViewController()
        vc.player = player
        vc.delegate = context.coordinator
        vc.allowsPictureInPicturePlayback = true
        vc.showsPlaybackControls = true

        context.coordinator.player = player
        context.coordinator.setupTimeObserver()
        context.coordinator.setupStatusObserver()

        player.play()
        return vc
    }

    func updateUIViewController(_ vc: AVPlayerViewController, context: Context) {
        // Handle quality change: if the url changed, swap the item and seek
        guard let currentPlayer = context.coordinator.player else { return }
        let currentAsset = (currentPlayer.currentItem?.asset as? AVURLAsset)?.url
        if currentAsset != url {
            let currentSeconds = currentPlayer.currentTime().seconds
            let newItem = AVPlayerItem(url: url)
            currentPlayer.replaceCurrentItem(with: newItem)
            context.coordinator.reobserveStatus()
            if currentSeconds > 1 {
                let seekTime = CMTime(seconds: currentSeconds, preferredTimescale: 600)
                currentPlayer.seek(to: seekTime, toleranceBefore: .zero, toleranceAfter: .zero)
            }
            currentPlayer.play()
        }
    }

    static func dismantleUIViewController(_ vc: AVPlayerViewController, coordinator: Coordinator) {
        // Save final position before teardown
        if let seconds = coordinator.player?.currentTime().seconds, !seconds.isNaN {
            coordinator.parent.onTimeUpdate(seconds)
        }
        coordinator.cleanup()
    }

    // MARK: - Coordinator

    class Coordinator: NSObject, AVPlayerViewControllerDelegate {
        let parent: FullscreenPlayerView
        var player: AVPlayer?
        var timeObserver: Any?
        var statusObservation: NSKeyValueObservation?
        private let playerStore = PlayerStore.shared
        private var hasRestoredPosition = false

        init(parent: FullscreenPlayerView) {
            self.parent = parent
            super.init()
        }

        func setupTimeObserver() {
            guard let player = player else { return }
            let interval = CMTime(seconds: 5, preferredTimescale: 600)
            timeObserver = player.addPeriodicTimeObserver(forInterval: interval, queue: .main) { [weak self] time in
                guard let self = self else { return }
                let seconds = time.seconds
                guard !seconds.isNaN && seconds > 0 else { return }

                self.parent.onTimeUpdate(seconds)

                // Save progress to PlayerStore
                if let duration = player.currentItem?.duration.seconds,
                   !duration.isNaN && duration > 0 {
                    let progress = seconds / duration
                    self.playerStore.updateProgress(
                        animeId: self.parent.anime.id,
                        episodeNumber: self.parent.episode.episodeNumber,
                        progress: progress,
                        anime: self.parent.anime
                    )
                }
            }
        }

        func setupStatusObserver() {
            guard let player = player else { return }
            statusObservation?.invalidate()
            statusObservation = player.currentItem?.observe(\.status, options: [.new]) { [weak self] item, _ in
                guard let self = self, item.status == .readyToPlay, !self.hasRestoredPosition else { return }
                self.hasRestoredPosition = true

                let startTime = self.parent.startTime
                if startTime < 0 {
                    // Negative = fractional progress
                    let duration = item.duration.seconds
                    if !duration.isNaN && duration > 0 {
                        let seekSeconds = abs(startTime) * duration
                        let time = CMTime(seconds: seekSeconds, preferredTimescale: 600)
                        player.seek(to: time, toleranceBefore: .zero, toleranceAfter: .zero)
                    }
                } else if startTime > 1 {
                    // Positive = absolute seconds
                    let time = CMTime(seconds: startTime, preferredTimescale: 600)
                    player.seek(to: time, toleranceBefore: .zero, toleranceAfter: .zero)
                }
            }
        }

        func reobserveStatus() {
            hasRestoredPosition = true // Don't re-seek on quality change
            statusObservation?.invalidate()
            guard let player = player else { return }
            statusObservation = player.currentItem?.observe(\.status, options: [.new]) { [weak player] item, _ in
                guard item.status == .readyToPlay else { return }
                player?.play()
            }
        }

        func cleanup() {
            if let observer = timeObserver, let player = player {
                player.removeTimeObserver(observer)
            }
            timeObserver = nil
            statusObservation?.invalidate()
            statusObservation = nil
            player?.pause()
            player?.replaceCurrentItem(with: nil)
            player = nil
        }

        deinit {
            cleanup()
        }
    }
}
