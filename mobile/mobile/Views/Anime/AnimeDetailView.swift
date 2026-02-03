//
//  AnimeDetailView.swift
//  mobile
//
//  LuAnime iOS App - Anime Detail View
//

import SwiftUI

struct AnimeDetailView: View {
    let anime: Anime

    @State private var voiceovers: [Translation] = []
    @State private var selectedVoiceover: Translation?
    @State private var sources: [VideoSource] = []
    @State private var selectedSource: VideoSource?
    @State private var episodes: [Episode] = []
    @State private var selectedEpisode: Episode?
    @State private var isLoading = true
    @State private var isLoadingEpisodes = false
    @State private var error: String?
    @State private var loadingTask: Task<Void, Never>?

    // Video player state
    @State private var selectedQuality: String = "720"
    @State private var availableQualities: [KodikVideoLink] = []

    @Environment(\.dismiss) private var dismiss

    private let favoritesStore = FavoritesStore.shared
    private let downloadStore = DownloadStore.shared

    var body: some View {
        ZStack {
            AppGradients.background
                .ignoresSafeArea()

            ScrollView(showsIndicators: false) {
                VStack(spacing: 0) {
                    heroSection
                    contentSection
                }
            }
            .ignoresSafeArea(edges: .top)
        }
        .navigationBarBackButtonHidden(true)
        .toolbar {
            ToolbarItem(placement: .topBarLeading) {
                GlassIconButton(icon: "chevron.left", isToolbarItem: true) {
                    dismiss()
                }
            }

            ToolbarItem(placement: .topBarTrailing) {
                HStack(spacing: 12) {
                    GlassIconButton(
                        icon: favoritesStore.isFavorite(anime.id) ? "heart.fill" : "heart",
                        tint: favoritesStore.isFavorite(anime.id) ? AppColors.error : .white,
                        isToolbarItem: true
                    ) {
                        favoritesStore.toggleFavorite(anime: anime)
                    }

                    GlassIconButton(icon: "square.and.arrow.up", isToolbarItem: true) {
                        // Share functionality
                    }
                }
            }
        }
        .task {
            await loadVoiceovers()
        }
    }

    // MARK: - Hero Section

    private var heroSection: some View {
        GeometryReader { geometry in
            let minY = geometry.frame(in: .global).minY
            let height = max(AppConstants.Layout.bannerHeight, AppConstants.Layout.bannerHeight + minY)

            ZStack(alignment: .bottom) {
                AnimeBannerImage(url: anime.imageURL ?? anime.posterURL)
                    .frame(width: geometry.size.width, height: height)
                    .clipped()
                    .offset(y: minY > 0 ? -minY : 0)

                LinearGradient(
                    colors: [.clear, AppColors.background],
                    startPoint: .center,
                    endPoint: .bottom
                )
            }
            .frame(height: height)
        }
        .frame(height: AppConstants.Layout.bannerHeight)
    }

    // MARK: - Content Section

    private var contentSection: some View {
        VStack(alignment: .leading, spacing: 24) {
            titleSection
            metadataSection

            // Embedded video player when episode is selected
            if let episode = selectedEpisode {
                playerSection(episode: episode)
            }

            if let description = anime.description, !description.isEmpty {
                descriptionSection(description)
            }

            translationSection

            if !episodes.isEmpty {
                episodeSection
            }

        }
        .padding(.horizontal)
        .padding(.top, -60)
    }

    // MARK: - Player Section

    @ViewBuilder
    private func playerSection(episode: Episode) -> some View {
        VStack(alignment: .leading, spacing: 12) {
            // Episode title
            HStack {
                Text("Episode \(episode.episodeNumber)")
                    .font(.headline)
                    .foregroundStyle(.white)

                if let name = episode.name, !name.isEmpty {
                    Text("- \(name)")
                        .font(.subheadline)
                        .foregroundStyle(AppColors.textSecondary)
                        .lineLimit(1)
                }

                Spacer()

                // Download button for current episode
                if let ep = selectedEpisode {
                    if downloadStore.isDownloaded(animeId: anime.id, episodeNumber: ep.episodeNumber) {
                        Image(systemName: "checkmark.circle.fill")
                            .font(.title3)
                            .foregroundStyle(AppColors.success)
                    } else if let progress = downloadStore.downloadProgress(animeId: anime.id, episodeNumber: ep.episodeNumber) {
                        ZStack {
                            Circle()
                                .stroke(Color.white.opacity(0.2), lineWidth: 2)
                            Circle()
                                .trim(from: 0, to: progress)
                                .stroke(AppColors.primary, style: StrokeStyle(lineWidth: 2, lineCap: .round))
                                .rotationEffect(.degrees(-90))
                        }
                        .frame(width: 22, height: 22)
                    } else {
                        Button {
                            downloadEpisode(ep)
                        } label: {
                            Image(systemName: "arrow.down.circle")
                                .font(.title3)
                                .foregroundStyle(AppColors.primary)
                        }
                    }
                }

                // Close player button
                Button {
                    selectedEpisode = nil
                    availableQualities = []
                } label: {
                    Image(systemName: "xmark.circle.fill")
                        .font(.title2)
                        .foregroundStyle(AppColors.textSecondary)
                }
            }

            // Video player
            EpisodePlayerView(
                anime: anime,
                episode: episode,
                selectedQuality: $selectedQuality,
                availableQualities: $availableQualities
            )

            // Quality selector (only for Kodik with multiple qualities)
            if availableQualities.count > 1 {
                qualitySelector
            }
        }
        .padding()
        .background(AppColors.surface)
        .clipShape(RoundedRectangle(cornerRadius: 16))
    }

    private var qualitySelector: some View {
        HStack {
            Text("Quality")
                .font(.subheadline)
                .foregroundStyle(AppColors.textSecondary)

            Spacer()

            Picker("Quality", selection: $selectedQuality) {
                ForEach(availableQualities, id: \.quality) { link in
                    Text("\(link.quality)p").tag(link.quality)
                }
            }
            .pickerStyle(.menu)
            .tint(.white)
        }
    }

    private var titleSection: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text(anime.displayTitle)
                .font(.title)
                .fontWeight(.bold)
                .foregroundStyle(.white)

            if let titleOriginal = anime.titleOriginal {
                Text(titleOriginal)
                    .font(.subheadline)
                    .foregroundStyle(AppColors.textSecondary)
            }
        }
    }

    private var metadataSection: some View {
        HStack(spacing: 16) {
            if let rating = anime.grade, rating > 0 {
                metadataItem(icon: "star.fill", value: String(format: "%.1f", rating), color: AppColors.rating)
            }

            if let year = anime.year {
                metadataItem(icon: "calendar", value: String(year))
            }

            metadataItem(icon: "play.rectangle", value: anime.episodesInfo + " ep.")

            if let status = anime.status {
                metadataItem(icon: "circle.fill", value: status.name, color: statusColor(status))
            }
        }
    }

    private func metadataItem(icon: String, value: String, color: Color = .white) -> some View {
        HStack(spacing: 4) {
            Image(systemName: icon)
                .foregroundStyle(color)
            Text(value)
        }
        .font(.caption)
        .foregroundStyle(AppColors.textSecondary)
        .padding(.horizontal, 12)
        .padding(.vertical, 6)
        .liquidGlassCapsule()
    }

    private func statusColor(_ status: AnimeStatus) -> Color {
        switch status.name.lowercased() {
        case "ongoing", "выходит":
            return AppColors.success
        case "released", "завершён":
            return AppColors.primary
        case "announced", "анонс":
            return AppColors.warning
        default:
            return AppColors.textSecondary
        }
    }

    private func descriptionSection(_ description: String) -> some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Description")
                .font(.headline)
                .foregroundStyle(.white)

            Text(description)
                .font(.subheadline)
                .foregroundStyle(AppColors.textSecondary)
                .lineLimit(5)
        }
    }

    // MARK: - Translation Section

    private var translationSection: some View {
        VStack(alignment: .leading, spacing: 16) {
            Text("Settings")
                .font(.headline)
                .foregroundStyle(.white)

            if isLoading {
                ProgressView()
                    .tint(AppColors.primary)
            } else if voiceovers.isEmpty {
                Text("No translations available")
                    .font(.subheadline)
                    .foregroundStyle(AppColors.textSecondary)
            } else {
                VStack(spacing: 12) {
                    // Voiceover picker
                    voiceoverPicker

                    // Source picker
                    if !sources.isEmpty {
                        sourcePicker
                    }
                }
                .padding()
                .background(AppColors.surface)
                .clipShape(RoundedRectangle(cornerRadius: 12))
            }
        }
    }

    private var voiceoverPicker: some View {
        HStack {
            Label("Voiceover", systemImage: "waveform")
                .font(.subheadline)
                .foregroundStyle(AppColors.textSecondary)

            Spacer()

            Picker("Voiceover", selection: Binding(
                get: { selectedVoiceover?.id ?? 0 },
                set: { newId in
                    if let voiceover = voiceovers.first(where: { $0.id == newId }) {
                        selectVoiceover(voiceover)
                    }
                }
            )) {
                ForEach(voiceovers) { voiceover in
                    Text(voiceover.displayName).tag(voiceover.id)
                }
            }
            .pickerStyle(.menu)
            .tint(.white)
        }
    }

    private var sourcePicker: some View {
        HStack {
            Label("Source", systemImage: "server.rack")
                .font(.subheadline)
                .foregroundStyle(AppColors.textSecondary)

            Spacer()

            Picker("Source", selection: Binding(
                get: { selectedSource?.id ?? 0 },
                set: { newId in
                    if let source = sources.first(where: { $0.id == newId }) {
                        selectSource(source)
                    }
                }
            )) {
                ForEach(sources) { source in
                    Text(source.displayName).tag(source.id)
                }
            }
            .pickerStyle(.menu)
            .tint(.white)
        }
    }

    // MARK: - Episode Section

    private var episodeSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Text("Episodes")
                    .font(.headline)
                    .foregroundStyle(.white)

                Spacer()

                if isLoadingEpisodes {
                    ProgressView()
                        .tint(AppColors.primary)
                }

                // Download All button
                if !episodes.isEmpty {
                    Button {
                        downloadAllEpisodes()
                    } label: {
                        HStack(spacing: 4) {
                            Image(systemName: "arrow.down.circle")
                                .font(.caption)
                            Text("All")
                                .font(.caption)
                        }
                        .foregroundStyle(AppColors.primary)
                        .padding(.horizontal, 10)
                        .padding(.vertical, 5)
                        .background(AppColors.primary.opacity(0.15))
                        .clipShape(Capsule())
                    }
                }
            }

            EpisodeListView(
                episodes: episodes,
                animeId: anime.id,
                selectedEpisode: selectedEpisode
            ) { episode in
                // Reset quality state for new episode
                availableQualities = []
                selectedQuality = "720"
                selectedEpisode = episode
            }
        }
    }

    // MARK: - Download Actions

    private func downloadEpisode(_ episode: Episode) {
        guard let url = episode.url else { return }
        downloadStore.downloadEpisode(
            anime: anime,
            episode: episode,
            kodikURL: url,
            quality: selectedQuality
        )
    }

    private func downloadAllEpisodes() {
        let downloadableEpisodes = episodes.filter { $0.url != nil }
        downloadStore.downloadAllEpisodes(
            anime: anime,
            episodes: downloadableEpisodes,
            quality: selectedQuality
        )
    }

    // MARK: - Data Loading

    private func loadVoiceovers() async {
        do {
            let result = try await APIService.shared.getVoiceovers(animeId: anime.id)
            await MainActor.run {
                voiceovers = result
                isLoading = false
                if let first = result.first {
                    selectVoiceover(first)
                }
            }
        } catch {
            await MainActor.run {
                self.error = error.localizedDescription
                isLoading = false
            }
        }
    }

    private func selectVoiceover(_ voiceover: Translation) {
        // Cancel any previous loading task
        loadingTask?.cancel()

        selectedVoiceover = voiceover
        sources = []
        episodes = []
        selectedSource = nil

        loadingTask = Task {
            do {
                // Check if cancelled before making request
                guard !Task.isCancelled else { return }

                let result = try await APIService.shared.getSources(animeId: anime.id, typeId: voiceover.id)

                // Check if cancelled after request completes
                guard !Task.isCancelled else { return }

                await MainActor.run {
                    sources = result
                    if let first = result.first {
                        selectSource(first)
                    }
                }
            } catch {
                if !Task.isCancelled {
                    print("Failed to load sources: \(error)")
                }
            }
        }
    }

    private func selectSource(_ source: VideoSource) {
        selectedSource = source
        isLoadingEpisodes = true

        Task {
            guard let voiceover = selectedVoiceover else { return }

            print("📺 Loading episodes for anime: \(anime.id), voiceover: \(voiceover.id), source: \(source.id)")

            do {
                let result = try await APIService.shared.getEpisodes(
                    animeId: anime.id,
                    typeId: voiceover.id,
                    sourceId: source.id
                )

                print("📺 Loaded \(result.count) episodes")
                for ep in result.prefix(3) {
                    print("📺 Episode \(ep.position): url=\(ep.url ?? "nil"), iframe=\(ep.iframe ?? false)")
                }

                await MainActor.run {
                    episodes = result
                    isLoadingEpisodes = false
                }
            } catch {
                await MainActor.run {
                    isLoadingEpisodes = false
                }
                print("❌ Failed to load episodes: \(error)")
            }
        }
    }
}
