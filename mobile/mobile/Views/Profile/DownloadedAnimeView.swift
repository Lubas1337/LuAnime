//
//  DownloadedAnimeView.swift
//  mobile
//
//  LuAnime iOS App - Downloaded Episodes for a Single Anime
//

import SwiftUI

struct DownloadedAnimeView: View {
    let anime: Anime
    let episodes: [DownloadedEpisode]

    @Environment(\.dismiss) private var dismiss

    private let downloadStore = DownloadStore.shared

    private var currentEpisodes: [DownloadedEpisode] {
        downloadStore.downloadedEpisodes
            .filter { $0.animeId == anime.id }
            .sorted { $0.episodeNumber < $1.episodeNumber }
    }

    var body: some View {
        ZStack {
            AppGradients.background
                .ignoresSafeArea()

            ScrollView(showsIndicators: false) {
                VStack(spacing: 20) {
                    animeHeader
                    episodesList
                }
                .padding()
            }
        }
        .navigationBarBackButtonHidden(true)
        .toolbar {
            ToolbarItem(placement: .topBarLeading) {
                GlassIconButton(icon: "chevron.left", isToolbarItem: true) {
                    dismiss()
                }
            }

            ToolbarItem(placement: .topBarTrailing) {
                Button {
                    downloadStore.deleteAllForAnime(animeId: anime.id)
                    dismiss()
                } label: {
                    HStack(spacing: 4) {
                        Image(systemName: "trash")
                        Text("Delete All")
                    }
                    .font(.subheadline)
                    .foregroundStyle(AppColors.error)
                }
            }
        }
    }

    private var animeHeader: some View {
        HStack(spacing: 16) {
            if let posterURL = anime.posterURL {
                AsyncImage(url: posterURL) { phase in
                    switch phase {
                    case .success(let image):
                        image
                            .resizable()
                            .aspectRatio(contentMode: .fill)
                    default:
                        RoundedRectangle(cornerRadius: 12)
                            .fill(AppColors.surface)
                    }
                }
                .frame(width: 80, height: 110)
                .clipShape(RoundedRectangle(cornerRadius: 12))
            }

            VStack(alignment: .leading, spacing: 8) {
                Text(anime.displayTitle)
                    .font(.title3)
                    .fontWeight(.bold)
                    .foregroundStyle(.white)
                    .lineLimit(2)

                let totalSize = currentEpisodes.reduce(Int64(0)) { $0 + $1.fileSize }
                Text("\(currentEpisodes.count) episodes")
                    .font(.subheadline)
                    .foregroundStyle(AppColors.textSecondary)

                Text(ByteCountFormatter.string(fromByteCount: totalSize, countStyle: .file))
                    .font(.caption)
                    .foregroundStyle(AppColors.textTertiary)
            }

            Spacer()
        }
        .padding()
        .background(AppColors.surface)
        .clipShape(RoundedRectangle(cornerRadius: 16))
    }

    private var episodesList: some View {
        VStack(spacing: 8) {
            ForEach(currentEpisodes) { episode in
                episodeRow(episode)
            }
        }
    }

    private func episodeRow(_ episode: DownloadedEpisode) -> some View {
        HStack(spacing: 12) {
            // Play button
            NavigationLink {
                if let localURL = episode.localURL {
                    OfflinePlayerView(
                        url: localURL,
                        anime: anime,
                        episodeNumber: episode.episodeNumber,
                        episodeName: episode.episodeName
                    )
                }
            } label: {
                Image(systemName: "play.circle.fill")
                    .font(.title2)
                    .foregroundStyle(AppColors.primary)
            }

            VStack(alignment: .leading, spacing: 4) {
                Text("Episode \(episode.episodeNumber)")
                    .font(.subheadline)
                    .fontWeight(.medium)
                    .foregroundStyle(.white)

                if let name = episode.episodeName, !name.isEmpty {
                    Text(name)
                        .font(.caption)
                        .foregroundStyle(AppColors.textSecondary)
                        .lineLimit(1)
                }

                HStack(spacing: 8) {
                    Text(episode.fileSizeFormatted)
                    Text("\u{2022}")
                    Text("\(episode.quality)p")
                    Text("\u{2022}")
                    Text(episode.downloadedAt, style: .date)
                }
                .font(.caption2)
                .foregroundStyle(AppColors.textTertiary)
            }

            Spacer()

            // Delete button
            Button {
                downloadStore.deleteDownload(animeId: episode.animeId, episodeNumber: episode.episodeNumber)
            } label: {
                Image(systemName: "trash")
                    .font(.subheadline)
                    .foregroundStyle(AppColors.error.opacity(0.8))
            }
        }
        .padding(12)
        .background(AppColors.surface)
        .clipShape(RoundedRectangle(cornerRadius: 12))
    }
}

// MARK: - Offline Player View (uses local file directly)

struct OfflinePlayerView: View {
    let url: URL
    let anime: Anime
    let episodeNumber: Int
    let episodeName: String?

    @Environment(\.dismiss) private var dismiss
    @State private var savedSeekTime: Double = 0

    private let playerStore = PlayerStore.shared

    var body: some View {
        ZStack {
            Color.black.ignoresSafeArea()

            FullscreenPlayerView(
                url: url,
                startTime: savedSeekTime,
                anime: anime,
                episode: Episode(position: episodeNumber, name: episodeName, url: nil, iframe: false),
                onTimeUpdate: { savedSeekTime = $0 },
                onDismiss: { dismiss() }
            )
            .ignoresSafeArea()
        }
        .navigationBarHidden(true)
        .onAppear {
            if let savedProgress = playerStore.getProgress(animeId: anime.id, episodeNumber: episodeNumber),
               savedProgress > 0.01 && savedProgress < 0.95 {
                savedSeekTime = -savedProgress
            }
        }
    }
}
