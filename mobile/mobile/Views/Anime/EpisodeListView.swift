//
//  EpisodeListView.swift
//  mobile
//
//  LuAnime iOS App - Episode List View
//

import SwiftUI

struct EpisodeListView: View {
    let episodes: [Episode]
    var selectedEpisode: Episode?
    var onSelect: ((Episode) -> Void)?

    private let playerStore = PlayerStore.shared

    var body: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: 12) {
                ForEach(episodes) { episode in
                    EpisodeCard(
                        episode: episode,
                        isSelected: selectedEpisode?.position == episode.position,
                        progress: playerStore.getProgress(
                            animeId: playerStore.currentAnime?.id ?? 0,
                            episodeNumber: episode.episodeNumber
                        )
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
    var onTap: (() -> Void)?

    var body: some View {
        Button {
            onTap?()
        } label: {
            VStack(spacing: 8) {
                ZStack {
                    RoundedRectangle(cornerRadius: 12)
                        .fill(isSelected ? AppColors.primary : AppColors.surface)
                        .frame(width: 80, height: 80)

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

