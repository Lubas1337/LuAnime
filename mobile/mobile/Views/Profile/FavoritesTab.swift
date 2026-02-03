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
                if let posterURL = anime.posterURL ?? anime.imageURL {
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
                    Text(anime.displayTitle)
                        .font(.subheadline)
                        .fontWeight(.medium)
                        .foregroundStyle(.white)
                        .lineLimit(1)

                    HStack(spacing: 8) {
                        if let rating = anime.grade, rating > 0 {
                            HStack(spacing: 4) {
                                Image(systemName: "star.fill")
                                    .foregroundStyle(AppColors.rating)
                                Text(String(format: "%.1f", rating))
                            }
                        }

                        Text(anime.episodesInfo + " ep.")
                    }
                    .font(.caption)
                    .foregroundStyle(AppColors.textSecondary)
                }

                Spacer()

                Button {
                    onRemove?()
                } label: {
                    Image(systemName: "heart.fill")
                        .font(.subheadline)
                        .foregroundStyle(AppColors.error)
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

        FavoritesTab()
            .padding()
    }
}
