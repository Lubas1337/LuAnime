//
//  FavoritesTab.swift
//  mobile
//
//  LuAnime iOS App - Favorites Tab
//

import SwiftUI

struct FavoritesTab: View {
    @State private var favoritesStore = FavoritesStore.shared
    @State private var selectedAnime: Anime?

    var body: some View {
        Group {
            if favoritesStore.favorites.isEmpty {
                emptyState
            } else {
                favoritesList
            }
        }
        .navigationDestination(item: $selectedAnime) { anime in
            AnimeDetailView(anime: anime)
        }
    }

    private var emptyState: some View {
        VStack(spacing: 16) {
            Image(systemName: "heart.slash")
                .font(.system(size: 48))
                .foregroundStyle(AppColors.textTertiary)

            Text("No Favorites Yet")
                .font(.headline)
                .foregroundStyle(.white)

            Text("Start adding anime to your favorites")
                .font(.subheadline)
                .foregroundStyle(AppColors.textSecondary)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 48)
    }

    private var favoritesList: some View {
        LazyVStack(spacing: 12) {
            ForEach(favoritesStore.favorites) { item in
                if let anime = item.anime {
                    FavoriteRow(anime: anime) {
                        selectedAnime = anime
                    } onRemove: {
                        withAnimation {
                            favoritesStore.removeFavorite(animeId: item.animeId)
                        }
                    }
                }
            }
        }
    }
}

struct FavoriteRow: View {
    let anime: Anime
    var onTap: (() -> Void)?
    var onRemove: (() -> Void)?

    var body: some View {
        Button {
            onTap?()
        } label: {
            HStack(spacing: 12) {
                AnimePosterImage(
                    url: anime.posterURL ?? anime.imageURL,
                    cornerRadius: 12
                )
                .frame(width: 70, height: 100)

                VStack(alignment: .leading, spacing: 6) {
                    Text(anime.displayTitle)
                        .font(.headline)
                        .foregroundStyle(.white)
                        .lineLimit(2)

                    HStack(spacing: 12) {
                        if let rating = anime.grade, rating > 0 {
                            HStack(spacing: 4) {
                                Image(systemName: "star.fill")
                                    .foregroundStyle(AppColors.rating)
                                Text(String(format: "%.1f", rating))
                            }
                            .font(.caption)
                            .foregroundStyle(AppColors.textSecondary)
                        }

                        Text(anime.episodesInfo + " ep.")
                            .font(.caption)
                            .foregroundStyle(AppColors.textSecondary)
                    }
                }

                Spacer()

                Button {
                    onRemove?()
                } label: {
                    Image(systemName: "heart.fill")
                        .font(.title3)
                        .foregroundStyle(AppColors.error)
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

        FavoritesTab()
            .padding()
    }
}
