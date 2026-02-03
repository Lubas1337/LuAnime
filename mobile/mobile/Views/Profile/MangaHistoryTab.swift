//
//  MangaHistoryTab.swift
//  mobile
//
//  LuAnime iOS App - Manga History Tab
//

import SwiftUI

struct MangaHistoryTab: View {
    @State private var mangaStore = MangaStore.shared
    @Binding var selectedManga: Manga?

    var body: some View {
        Group {
            if mangaStore.readingHistory.isEmpty {
                emptyState
            } else {
                historyList
            }
        }
    }

    private var emptyState: some View {
        VStack(spacing: 16) {
            Image(systemName: "clock.arrow.circlepath")
                .font(.system(size: 48))
                .foregroundStyle(AppColors.textTertiary)

            Text("No Reading History")
                .font(.headline)
                .foregroundStyle(.white)

            Text("Start reading manga to build your history")
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
                        mangaStore.clearHistory()
                    }
                }
                .font(.subheadline)
                .foregroundStyle(AppColors.textSecondary)
            }

            ForEach(mangaStore.getRecentHistoryGroupedByManga()) { item in
                MangaHistoryRow(item: item) {
                    if let manga = item.manga {
                        selectedManga = manga
                    }
                } onRemove: {
                    withAnimation {
                        mangaStore.removeMangaFromHistory(mangaId: item.mangaId)
                    }
                }
            }
        }
    }
}

struct MangaHistoryRow: View {
    let item: MangaReadingProgress
    var onTap: (() -> Void)?
    var onRemove: (() -> Void)?

    var body: some View {
        Button {
            onTap?()
        } label: {
            HStack(spacing: 12) {
                if let posterURL = item.manga?.posterURL {
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
                    Text(item.manga?.displayTitle ?? "Manga")
                        .font(.subheadline)
                        .fontWeight(.medium)
                        .foregroundStyle(.white)
                        .lineLimit(1)

                    HStack(spacing: 8) {
                        if let chapterNumber = item.chapterNumber {
                            Text("Ch. \(chapterNumber)")
                                .foregroundStyle(AppColors.primary)
                        }

                        Text("\(Int(item.progress * 100))%")
                            .foregroundStyle(AppColors.textSecondary)

                        Text(item.updatedAt.timeAgo)
                            .foregroundStyle(AppColors.textTertiary)
                    }
                    .font(.caption)
                }

                Spacer()

                Button {
                    onRemove?()
                } label: {
                    Image(systemName: "xmark.circle.fill")
                        .font(.subheadline)
                        .foregroundStyle(AppColors.textTertiary)
                }
            }
            .padding(12)
            .background(AppColors.surface)
            .clipShape(RoundedRectangle(cornerRadius: 12))
        }
        .buttonStyle(.plain)
    }
}

#Preview {
    ZStack {
        AppGradients.background
            .ignoresSafeArea()

        MangaHistoryTab(selectedManga: .constant(nil))
            .padding()
    }
}
