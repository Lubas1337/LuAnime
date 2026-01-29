//
//  HistoryTab.swift
//  mobile
//
//  LuAnime iOS App - History Tab
//

import SwiftUI

struct HistoryTab: View {
    @State private var playerStore = PlayerStore.shared
    @State private var selectedAnime: Anime?

    var body: some View {
        Group {
            if playerStore.watchHistory.isEmpty {
                emptyState
            } else {
                historyList
            }
        }
        .navigationDestination(item: $selectedAnime) { anime in
            AnimeDetailView(anime: anime)
        }
    }

    private var emptyState: some View {
        VStack(spacing: 16) {
            Image(systemName: "clock.arrow.circlepath")
                .font(.system(size: 48))
                .foregroundStyle(AppColors.textTertiary)

            Text("No Watch History")
                .font(.headline)
                .foregroundStyle(.white)

            Text("Start watching anime to build your history")
                .font(.subheadline)
                .foregroundStyle(AppColors.textSecondary)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 48)
    }

    private var historyList: some View {
        LazyVStack(spacing: 12) {
            HStack {
                Text("Recent")
                    .font(.headline)
                    .foregroundStyle(.white)

                Spacer()

                Button("Clear All") {
                    withAnimation {
                        playerStore.clearHistory()
                    }
                }
                .font(.subheadline)
                .foregroundStyle(AppColors.textSecondary)
            }

            ForEach(playerStore.getRecentHistory()) { item in
                HistoryRow(item: item) {
                    if let anime = item.anime {
                        selectedAnime = anime
                    }
                } onRemove: {
                    withAnimation {
                        playerStore.removeFromHistory(
                            animeId: item.animeId,
                            episodeNumber: item.episodeNumber
                        )
                    }
                }
            }
        }
    }
}

struct HistoryRow: View {
    let item: WatchHistoryItem
    var onTap: (() -> Void)?
    var onRemove: (() -> Void)?

    var body: some View {
        Button {
            onTap?()
        } label: {
            HStack(spacing: 12) {
                ZStack(alignment: .bottomLeading) {
                    AnimePosterImage(
                        url: item.anime?.posterURL ?? item.anime?.imageURL,
                        cornerRadius: 12
                    )
                    .frame(width: 100, height: 65)

                    // Progress indicator
                    GeometryReader { geometry in
                        VStack {
                            Spacer()
                            Rectangle()
                                .fill(AppColors.primary)
                                .frame(width: geometry.size.width * item.progress, height: 3)
                        }
                    }
                    .frame(width: 100, height: 65)
                    .clipShape(RoundedRectangle(cornerRadius: 12))
                }

                VStack(alignment: .leading, spacing: 6) {
                    Text(item.anime?.displayTitle ?? "Anime #\(item.animeId)")
                        .font(.subheadline)
                        .fontWeight(.medium)
                        .foregroundStyle(.white)
                        .lineLimit(2)

                    HStack(spacing: 8) {
                        Text("Episode \(item.episodeNumber)")
                            .font(.caption)
                            .foregroundStyle(AppColors.primary)

                        Text("\(Int(item.progress * 100))%")
                            .font(.caption)
                            .foregroundStyle(AppColors.textSecondary)
                    }

                    Text(item.updatedAt.timeAgo)
                        .font(.caption2)
                        .foregroundStyle(AppColors.textTertiary)
                }

                Spacer()

                Button {
                    onRemove?()
                } label: {
                    Image(systemName: "xmark.circle.fill")
                        .foregroundStyle(AppColors.textTertiary)
                }
            }
            .padding(12)
            .liquidGlass(cornerRadius: AppConstants.Layout.cornerRadius)
        }
        .buttonStyle(.plain)
    }
}

#Preview {
    ZStack {
        AppGradients.background
            .ignoresSafeArea()

        HistoryTab()
            .padding()
    }
}
