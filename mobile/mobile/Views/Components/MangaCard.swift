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

                HStack(spacing: 8) {
                    if let typeName = manga.typeName {
                        Text(typeName)
                    }

                    if let status = manga.status {
                        HStack(spacing: 4) {
                            Circle()
                                .fill(statusColor(status))
                                .frame(width: 6, height: 6)
                            Text(manga.statusDisplay)
                        }
                    }

                    if let year = manga.year {
                        Text(String(year))
                    }
                }
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
