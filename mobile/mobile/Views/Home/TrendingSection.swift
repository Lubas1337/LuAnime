//
//  TrendingSection.swift
//  mobile
//
//  LuAnime iOS App - Trending Section
//

import SwiftUI

struct TrendingSection: View {
    let animes: [Anime]
    var isLoading: Bool = false
    var onSelect: ((Anime) -> Void)?

    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            header

            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: 16) {
                    if isLoading {
                        ForEach(0..<5, id: \.self) { _ in
                            TrendingCardSkeleton()
                        }
                    } else {
                        ForEach(Array(animes.enumerated()), id: \.element.id) { index, anime in
                            TrendingCard(anime: anime, rank: index + 1) {
                                onSelect?(anime)
                            }
                        }
                    }
                }
                .padding(.horizontal)
            }
        }
    }

    private var header: some View {
        HStack {
            HStack(spacing: 8) {
                Image(systemName: "flame.fill")
                    .foregroundStyle(AppColors.error)
                Text("Trending Now")
                    .font(.title2)
                    .fontWeight(.bold)
                    .foregroundStyle(.white)
            }

            Spacer()
        }
        .padding(.horizontal)
    }
}

struct TrendingCard: View {
    let anime: Anime
    let rank: Int
    var onTap: (() -> Void)?

    var body: some View {
        Button {
            onTap?()
        } label: {
            ZStack(alignment: .bottomLeading) {
                AnimePosterImage(
                    url: anime.posterURL ?? anime.imageURL,
                    cornerRadius: AppConstants.Layout.cornerRadius
                )
                .frame(width: 180, height: 260)

                LinearGradient(
                    colors: [.clear, .black.opacity(0.8)],
                    startPoint: .center,
                    endPoint: .bottom
                )
                .clipShape(RoundedRectangle(cornerRadius: AppConstants.Layout.cornerRadius))

                VStack(alignment: .leading, spacing: 4) {
                    Text("#\(rank)")
                        .font(.system(size: 48, weight: .black))
                        .foregroundStyle(AppColors.primary)

                    Text(anime.displayTitle)
                        .font(.subheadline)
                        .fontWeight(.semibold)
                        .foregroundStyle(.white)
                        .lineLimit(2)
                }
                .padding(12)
            }
        }
        .buttonStyle(.plain)
    }
}

struct TrendingCardSkeleton: View {
    var body: some View {
        RoundedRectangle(cornerRadius: AppConstants.Layout.cornerRadius)
            .fill(AppColors.surface)
            .frame(width: 180, height: 260)
            .shimmering()
    }
}

#Preview {
    ZStack {
        AppGradients.background
            .ignoresSafeArea()

        TrendingSection(
            animes: [],
            isLoading: true
        )
    }
}
