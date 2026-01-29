//
//  MangaCard.swift
//  mobile
//
//  LuAnime iOS App - Manga Card Component
//

import SwiftUI

struct MangaCard: View {
    let manga: Manga
    var showStatus: Bool = true

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            posterImage

            VStack(alignment: .leading, spacing: 4) {
                Text(manga.displayTitle)
                    .font(.subheadline)
                    .fontWeight(.medium)
                    .foregroundStyle(.white)
                    .lineLimit(2)
                    .multilineTextAlignment(.leading)

                if let typeName = manga.typeName {
                    Text(typeName)
                        .font(.caption)
                        .foregroundStyle(AppColors.textSecondary)
                        .lineLimit(1)
                }
            }
        }
        .frame(width: AppConstants.Layout.cardWidth)
    }

    private var posterImage: some View {
        ZStack(alignment: .topTrailing) {
            AnimePosterImage(
                url: manga.posterURL,
                cornerRadius: AppConstants.Layout.cornerRadius
            )
            .frame(width: AppConstants.Layout.cardWidth, height: AppConstants.Layout.cardHeight)

            if showStatus, let status = manga.status {
                statusBadge(status)
            }
        }
    }

    private func statusBadge(_ status: String) -> some View {
        Text(manga.statusDisplay)
            .font(.caption2)
            .fontWeight(.semibold)
            .foregroundStyle(.white)
            .padding(.horizontal, 8)
            .padding(.vertical, 4)
            .liquidGlassCapsule()
            .padding(8)
    }
}

struct MangaCardCompact: View {
    let manga: Manga

    var body: some View {
        HStack(spacing: 12) {
            AnimePosterImage(
                url: manga.posterURL,
                cornerRadius: 12
            )
            .frame(width: 80, height: 110)

            VStack(alignment: .leading, spacing: 6) {
                Text(manga.displayTitle)
                    .font(.headline)
                    .foregroundStyle(.white)
                    .lineLimit(2)

                if let typeName = manga.typeName {
                    Text(typeName)
                        .font(.caption)
                        .foregroundStyle(AppColors.textSecondary)
                        .lineLimit(1)
                }

                HStack(spacing: 12) {
                    if let status = manga.status {
                        HStack(spacing: 4) {
                            Circle()
                                .fill(statusColor(status))
                                .frame(width: 6, height: 6)
                            Text(manga.statusDisplay)
                        }
                        .font(.caption)
                        .foregroundStyle(AppColors.textSecondary)
                    }

                    if let year = manga.year {
                        Text(String(year))
                            .font(.caption)
                            .foregroundStyle(AppColors.textSecondary)
                    }
                }
            }

            Spacer()
        }
        .padding(12)
        .liquidGlass(cornerRadius: AppConstants.Layout.cornerRadius)
    }

    private func statusColor(_ status: String) -> Color {
        switch status.lowercased() {
        case "ongoing": return AppColors.success
        case "completed": return AppColors.primary
        case "hiatus": return AppColors.warning
        case "cancelled": return AppColors.error
        default: return AppColors.textSecondary
        }
    }
}

struct MangaCardSkeleton: View {
    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            RoundedRectangle(cornerRadius: AppConstants.Layout.cornerRadius)
                .fill(AppColors.surface)
                .frame(width: AppConstants.Layout.cardWidth, height: AppConstants.Layout.cardHeight)
                .shimmering()

            VStack(alignment: .leading, spacing: 4) {
                RoundedRectangle(cornerRadius: 4)
                    .fill(AppColors.surface)
                    .frame(height: 16)
                    .shimmering()

                RoundedRectangle(cornerRadius: 4)
                    .fill(AppColors.surface)
                    .frame(width: 60, height: 12)
                    .shimmering()
            }
        }
        .frame(width: AppConstants.Layout.cardWidth)
    }
}

#Preview {
    ZStack {
        AppGradients.background
            .ignoresSafeArea()
        MangaCardSkeleton()
            .padding()
    }
}
