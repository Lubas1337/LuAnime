//
//  ProfileView.swift
//  mobile
//
//  LuAnime iOS App - Profile View
//

import SwiftUI

struct ProfileView: View {
    private let downloadStore = DownloadStore.shared
    private let mangaDownloadStore = MangaDownloadStore.shared

    var body: some View {
        NavigationStack {
            ZStack {
                AppGradients.background
                    .ignoresSafeArea()

                ScrollView(showsIndicators: false) {
                    VStack(spacing: 24) {
                        statsSection

                        if !downloadStore.activeDownloads.isEmpty || !downloadStore.downloadedEpisodes.isEmpty {
                            downloadsSection
                        }

                        if !mangaDownloadStore.activeDownloads.isEmpty || !mangaDownloadStore.downloadedChapters.isEmpty {
                            mangaDownloadsSection
                        }

                    }
                    .padding()
                }
            }
            .navigationTitle("Profile")
            .navigationDestination(for: DownloadedAnimeDestination.self) { destination in
                DownloadedAnimeView(anime: destination.anime, episodes: destination.episodes)
            }
            .navigationDestination(for: DownloadedMangaDestination.self) { destination in
                DownloadedMangaView(manga: destination.manga, chapters: destination.chapters)
            }
        }
    }

    private var statsSection: some View {
        HStack(spacing: 16) {
            StatCard(
                icon: "heart.fill",
                value: "\(FavoritesStore.shared.favorites.count + MangaStore.shared.favorites.count)",
                label: "Favorites",
                color: AppColors.error
            )

            StatCard(
                icon: "play.fill",
                value: "\(PlayerStore.shared.watchHistory.count)",
                label: "Watched",
                color: AppColors.primary
            )

            StatCard(
                icon: "arrow.down.circle.fill",
                value: "\(downloadStore.downloadedEpisodes.count + mangaDownloadStore.downloadedChapters.count)",
                label: "Downloaded",
                color: AppColors.success
            )
        }
    }

    private var downloadsSection: some View {
        VStack(alignment: .leading, spacing: 16) {
            HStack {
                Text("Downloads")
                    .font(.headline)
                    .foregroundStyle(.white)

                Spacer()

                if downloadStore.totalStorageUsed > 0 {
                    Text(downloadStore.totalStorageFormatted)
                        .font(.caption)
                        .foregroundStyle(AppColors.textSecondary)
                }
            }

            // Active downloads
            if !downloadStore.activeDownloads.isEmpty {
                ForEach(Array(downloadStore.activeDownloads.values).sorted(by: { $0.id < $1.id })) { task in
                    activeDownloadRow(task)
                }
            }

            // Completed downloads grouped by anime
            let groups = downloadStore.episodesGroupedByAnime()
            ForEach(groups, id: \.anime.id) { group in
                NavigationLink(
                    value: DownloadedAnimeDestination(anime: group.anime, episodes: group.episodes)
                ) {
                    downloadedAnimeRow(anime: group.anime, episodes: group.episodes)
                }
                .buttonStyle(.plain)
            }
        }
    }

    private func activeDownloadRow(_ task: DownloadTask) -> some View {
        HStack(spacing: 12) {
            Image(systemName: "arrow.down.circle")
                .font(.title3)
                .foregroundStyle(AppColors.primary)

            VStack(alignment: .leading, spacing: 4) {
                Text(task.anime?.displayTitle ?? "Episode \(task.episodeNumber)")
                    .font(.subheadline)
                    .foregroundStyle(.white)
                    .lineLimit(1)

                Text("Episode \(task.episodeNumber)")
                    .font(.caption)
                    .foregroundStyle(AppColors.textSecondary)
            }

            Spacer()

            switch task.status {
            case .waiting:
                Text("Waiting")
                    .font(.caption)
                    .foregroundStyle(AppColors.textSecondary)
            case .downloading:
                ProgressView(value: task.progress)
                    .progressViewStyle(.linear)
                    .tint(AppColors.primary)
                    .frame(width: 60)
            case .failed(let error):
                Text("Failed")
                    .font(.caption)
                    .foregroundStyle(AppColors.error)
            }
        }
        .padding(12)
        .background(AppColors.surface)
        .clipShape(RoundedRectangle(cornerRadius: 12))
    }

    private func downloadedAnimeRow(anime: Anime, episodes: [DownloadedEpisode]) -> some View {
        HStack(spacing: 12) {
            if let posterURL = anime.posterURL {
                AsyncImage(url: posterURL) { phase in
                    switch phase {
                    case .success(let image):
                        image
                            .resizable()
                            .aspectRatio(contentMode: .fill)
                    default:
                        RoundedRectangle(cornerRadius: 8)
                            .fill(AppColors.surface)
                    }
                }
                .frame(width: 50, height: 70)
                .clipShape(RoundedRectangle(cornerRadius: 8))
            }

            VStack(alignment: .leading, spacing: 4) {
                Text(anime.displayTitle)
                    .font(.subheadline)
                    .fontWeight(.medium)
                    .foregroundStyle(.white)
                    .lineLimit(1)

                let totalSize = episodes.reduce(Int64(0)) { $0 + $1.fileSize }
                Text("\(episodes.count) ep. \u{2022} \(ByteCountFormatter.string(fromByteCount: totalSize, countStyle: .file))")
                    .font(.caption)
                    .foregroundStyle(AppColors.textSecondary)
            }

            Spacer()

            Image(systemName: "chevron.right")
                .font(.caption)
                .foregroundStyle(AppColors.textTertiary)
        }
        .padding(12)
        .background(AppColors.surface)
        .clipShape(RoundedRectangle(cornerRadius: 12))
    }

    // MARK: - Manga Downloads Section

    private var mangaDownloadsSection: some View {
        VStack(alignment: .leading, spacing: 16) {
            HStack {
                Text("Manga Downloads")
                    .font(.headline)
                    .foregroundStyle(.white)

                Spacer()

                if mangaDownloadStore.totalStorageUsed > 0 {
                    Text(mangaDownloadStore.totalStorageFormatted)
                        .font(.caption)
                        .foregroundStyle(AppColors.textSecondary)
                }
            }

            // Active manga downloads
            if !mangaDownloadStore.activeDownloads.isEmpty {
                ForEach(Array(mangaDownloadStore.activeDownloads.values).sorted(by: { $0.id < $1.id })) { task in
                    activeMangaDownloadRow(task)
                }
            }

            // Completed downloads grouped by manga
            let groups = mangaDownloadStore.chaptersGroupedByManga()
            ForEach(groups, id: \.manga.id) { group in
                NavigationLink(
                    value: DownloadedMangaDestination(manga: group.manga, chapters: group.chapters)
                ) {
                    downloadedMangaRow(manga: group.manga, chapters: group.chapters)
                }
                .buttonStyle(.plain)
            }
        }
    }

    private func activeMangaDownloadRow(_ task: MangaDownloadTask) -> some View {
        HStack(spacing: 12) {
            Image(systemName: "arrow.down.circle")
                .font(.title3)
                .foregroundStyle(AppColors.primary)

            VStack(alignment: .leading, spacing: 4) {
                Text(task.manga?.displayTitle ?? "Manga")
                    .font(.subheadline)
                    .foregroundStyle(.white)
                    .lineLimit(1)

                Text(task.chapterDisplayName)
                    .font(.caption)
                    .foregroundStyle(AppColors.textSecondary)
            }

            Spacer()

            switch task.status {
            case .waiting:
                Text("Waiting")
                    .font(.caption)
                    .foregroundStyle(AppColors.textSecondary)
            case .downloading:
                ProgressView(value: task.progress)
                    .progressViewStyle(.linear)
                    .tint(AppColors.primary)
                    .frame(width: 60)
            case .failed:
                Text("Failed")
                    .font(.caption)
                    .foregroundStyle(AppColors.error)
            }
        }
        .padding(12)
        .background(AppColors.surface)
        .clipShape(RoundedRectangle(cornerRadius: 12))
    }

    private func downloadedMangaRow(manga: Manga, chapters: [DownloadedChapter]) -> some View {
        HStack(spacing: 12) {
            if let posterURL = manga.posterURL {
                AsyncImage(url: posterURL) { phase in
                    switch phase {
                    case .success(let image):
                        image
                            .resizable()
                            .aspectRatio(contentMode: .fill)
                    default:
                        RoundedRectangle(cornerRadius: 8)
                            .fill(AppColors.surface)
                    }
                }
                .frame(width: 50, height: 70)
                .clipShape(RoundedRectangle(cornerRadius: 8))
            }

            VStack(alignment: .leading, spacing: 4) {
                Text(manga.displayTitle)
                    .font(.subheadline)
                    .fontWeight(.medium)
                    .foregroundStyle(.white)
                    .lineLimit(1)

                let totalSize = chapters.reduce(Int64(0)) { $0 + $1.fileSize }
                Text("\(chapters.count) ch. \u{2022} \(ByteCountFormatter.string(fromByteCount: totalSize, countStyle: .file))")
                    .font(.caption)
                    .foregroundStyle(AppColors.textSecondary)
            }

            Spacer()

            Image(systemName: "chevron.right")
                .font(.caption)
                .foregroundStyle(AppColors.textTertiary)
        }
        .padding(12)
        .background(AppColors.surface)
        .clipShape(RoundedRectangle(cornerRadius: 12))
    }
}

struct DownloadedMangaDestination: Hashable {
    let manga: Manga
    let chapters: [DownloadedChapter]
}

struct DownloadedAnimeDestination: Hashable {
    let anime: Anime
    let episodes: [DownloadedEpisode]
}

struct StatCard: View {
    let icon: String
    let value: String
    let label: String
    let color: Color

    var body: some View {
        VStack(spacing: 8) {
            HStack(spacing: 8) {
                Image(systemName: icon)
                    .foregroundStyle(color)
                Text(value)
                    .font(.title2)
                    .fontWeight(.bold)
            }
            .foregroundStyle(.white)

            Text(label)
                .font(.caption)
                .foregroundStyle(AppColors.textSecondary)
        }
        .frame(maxWidth: .infinity)
        .padding(16)
        .liquidGlass(cornerRadius: AppConstants.Layout.cornerRadius)
    }
}

#Preview {
    ProfileView()
}
