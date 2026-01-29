//
//  AnimeCard.swift
//  mobile
//
//  LuAnime iOS App - Anime Card Component
//

import SwiftUI

struct AnimeCard: View {
    let anime: Anime
    var showRating: Bool = true
    var showEpisodes: Bool = true

    @Namespace private var namespace

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            posterImage

            VStack(alignment: .leading, spacing: 4) {
                Text(anime.displayTitle)
                    .font(.subheadline)
                    .fontWeight(.medium)
                    .foregroundStyle(.white)
                    .lineLimit(2)
                    .multilineTextAlignment(.leading)

                if showEpisodes {
                    Text(anime.episodesInfo + " эп.")
                        .font(.caption)
                        .foregroundStyle(AppColors.textSecondary)
                }
            }
        }
        .frame(width: AppConstants.Layout.cardWidth)
    }

    private var posterImage: some View {
        ZStack(alignment: .topTrailing) {
            AnimePosterImage(
                url: anime.posterURL ?? anime.imageURL,
                cornerRadius: AppConstants.Layout.cornerRadius
            )
            .frame(width: AppConstants.Layout.cardWidth, height: AppConstants.Layout.cardHeight)

            if showRating, let rating = anime.grade, rating > 0 {
                ratingBadge(rating)
            }
        }
    }

    private func ratingBadge(_ rating: Double) -> some View {
        HStack(spacing: 4) {
            Image(systemName: "star.fill")
                .font(.caption2)
            Text(String(format: "%.1f", rating))
                .font(.caption)
                .fontWeight(.semibold)
        }
        .foregroundStyle(.white)
        .padding(.horizontal, 8)
        .padding(.vertical, 4)
        .liquidGlassCapsule()
        .padding(8)
    }
}

struct AnimeCardCompact: View {
    let anime: Anime

    var body: some View {
        HStack(spacing: 12) {
            AnimePosterImage(
                url: anime.posterURL ?? anime.imageURL,
                cornerRadius: 12
            )
            .frame(width: 80, height: 110)

            VStack(alignment: .leading, spacing: 6) {
                Text(anime.displayTitle)
                    .font(.headline)
                    .foregroundStyle(.white)
                    .lineLimit(2)

                if !anime.genresList.isEmpty {
                    Text(anime.genresList.prefix(3).joined(separator: ", "))
                        .font(.caption)
                        .foregroundStyle(AppColors.textSecondary)
                        .lineLimit(1)
                }

                HStack(spacing: 12) {
                    if let rating = anime.grade, rating > 0 {
                        HStack(spacing: 4) {
                            Image(systemName: "star.fill")
                                .foregroundStyle(AppColors.rating)
                            Text(String(format: "%.1f", rating))
                        }
                        .font(.caption)
                        .foregroundStyle(.white)
                    }

                    Text(anime.episodesInfo + " эп.")
                        .font(.caption)
                        .foregroundStyle(AppColors.textSecondary)
                }
            }

            Spacer()
        }
        .padding(12)
        .liquidGlass(cornerRadius: AppConstants.Layout.cornerRadius)
    }
}

struct AnimeCardSkeleton: View {
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

        ScrollView {
            VStack(spacing: 20) {
                AnimeCard(
                    anime: Anime(
                        id: 1,
                        titleRu: "Атака Титанов",
                        titleEn: "Attack on Titan",
                        titleOriginal: nil,
                        titleAlt: nil,
                        poster: nil,
                        image: "https://example.com/poster.jpg",
                        rating: nil,
                        grade: 9.2,
                        episodesTotal: 87,
                        episodesReleased: 87,
                        genres: "Action, Drama",
                        country: "Japan",
                        status: nil,
                        year: "2013",
                        duration: 24,
                        category: nil,
                        description: nil,
                        broadcast: nil,
                        screenshots: nil,
                        source: nil,
                        director: nil,
                        studio: nil,
                        season: nil
                    )
                )

                AnimeCardSkeleton()
            }
            .padding()
        }
    }
}
