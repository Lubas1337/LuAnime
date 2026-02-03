//
//  EpisodeListView.swift
//  mobile
//
//  LuAnime iOS App - Episode List View
//

import SwiftUI

struct EpisodeListView: View {
    let episodes: [Episode]
    let animeId: Int
    var selectedEpisode: Episode?
    var onSelect: ((Episode) -> Void)?

    private let playerStore = PlayerStore.shared
    private let downloadStore = DownloadStore.shared

    var body: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: 12) {
                ForEach(episodes) { episode in
                    EpisodeCard(
                        episode: episode,
                        isSelected: selectedEpisode?.position == episode.position,
                        progress: playerStore.getProgress(
                            animeId: animeId,
                            episodeNumber: episode.episodeNumber
                        ),
                        isDownloaded: downloadStore.isDownloaded(animeId: animeId, episodeNumber: episode.episodeNumber),
                        downloadProgress: downloadStore.downloadProgress(animeId: animeId, episodeNumber: episode.episodeNumber)
                    ) {
                        onSelect?(episode)
                    }
                }
            }
        }
    }
}

struct EpisodeCard: View {
    let episode: Episode
    var isSelected: Bool = false
    var progress: Double?
    var isDownloaded: Bool = false
    var downloadProgress: Double?
    var onTap: (() -> Void)?

    private var cardBackground: Color {
        if isSelected {
            return AppColors.primary
        } else if isDownloaded {
            return AppColors.success.opacity(0.35)
        } else {
            return AppColors.surface
        }
    }

    var body: some View {
        Button {
            onTap?()
        } label: {
            VStack(spacing: 8) {
                ZStack {
                    // Base background
                    RoundedRectangle(cornerRadius: 12)
                        .fill(cardBackground)
                        .frame(width: 80, height: 80)

                    // Download progress fill: green fills from bottom up
                    if let downloadProgress = downloadProgress, !isSelected, !isDownloaded {
                        VStack {
                            Spacer()
                            RoundedRectangle(cornerRadius: 12)
                                .fill(AppColors.success.opacity(0.3))
                                .frame(height: 80 * downloadProgress)
                        }
                        .frame(width: 80, height: 80)
                        .clipShape(RoundedRectangle(cornerRadius: 12))
                    }

                    VStack(spacing: 4) {
                        Image(systemName: "play.fill")
                            .font(.title2)
                            .foregroundStyle(isSelected ? .white : AppColors.textSecondary)

                        Text("\(episode.episodeNumber)")
                            .font(.headline)
                            .fontWeight(.bold)
                            .foregroundStyle(isSelected ? .white : .white)
                    }

                    if let progress = progress, progress > 0 {
                        VStack {
                            Spacer()
                            GeometryReader { geometry in
                                RoundedRectangle(cornerRadius: 2)
                                    .fill(AppColors.primary)
                                    .frame(width: geometry.size.width * progress, height: 3)
                            }
                            .frame(height: 3)
                            .clipShape(RoundedRectangle(cornerRadius: 2))
                        }
                        .frame(width: 70)
                        .padding(.bottom, 6)
                    }
                }

                Text(episode.displayName)
                    .font(.caption)
                    .foregroundStyle(AppColors.textSecondary)
                    .lineLimit(2)
                    .multilineTextAlignment(.center)
            }
            .frame(width: 80)
        }
        .buttonStyle(.plain)
    }
}

struct EpisodeGridView: View {
    let episodes: [Episode]
    var selectedEpisode: Episode?
    var onSelect: ((Episode) -> Void)?

    private var columns: [GridItem] {
        Array(repeating: GridItem(.flexible(), spacing: 12), count: 5)
    }

    var body: some View {
        LazyVGrid(columns: columns, spacing: 12) {
            ForEach(episodes) { episode in
                EpisodeGridItem(
                    episode: episode,
                    isSelected: selectedEpisode?.position == episode.position
                ) {
                    onSelect?(episode)
                }
            }
        }
    }
}

struct EpisodeGridItem: View {
    let episode: Episode
    var isSelected: Bool = false
    var onTap: (() -> Void)?

    var body: some View {
        Button {
            onTap?()
        } label: {
            Text("\(episode.episodeNumber)")
                .font(.subheadline)
                .fontWeight(.medium)
                .foregroundStyle(isSelected ? .white : AppColors.textSecondary)
                .frame(width: 44, height: 44)
                .background(isSelected ? AppColors.primary : AppColors.surface)
                .clipShape(RoundedRectangle(cornerRadius: 8))
        }
        .buttonStyle(.plain)
    }
}

