//
//  AnimeGrid.swift
//  mobile
//
//  LuAnime iOS App - Anime Grid Component
//

import SwiftUI

struct AnimeGrid: View {
    let animes: [Anime]
    var columns: Int = 2
    var showLoadMore: Bool = false
    var isLoading: Bool = false
    var onLoadMore: (() -> Void)?
    var onSelect: ((Anime) -> Void)?

    private var gridColumns: [GridItem] {
        Array(repeating: GridItem(.flexible(), spacing: 16), count: columns)
    }

    var body: some View {
        LazyVGrid(columns: gridColumns, spacing: 20) {
            ForEach(animes) { anime in
                Button {
                    onSelect?(anime)
                } label: {
                    AnimeCard(anime: anime)
                }
                .buttonStyle(.plain)
            }

            if isLoading {
                ForEach(0..<columns, id: \.self) { _ in
                    AnimeCardSkeleton()
                }
            }
        }
        .padding(.horizontal)

        if showLoadMore && !isLoading {
            loadMoreButton
        }
    }

    private var loadMoreButton: some View {
        Button {
            onLoadMore?()
        } label: {
            Text("Load More")
                .font(.subheadline)
                .fontWeight(.medium)
                .foregroundStyle(.white)
                .padding(.horizontal, 24)
                .padding(.vertical, 12)
                .background(.ultraThinMaterial)
                .clipShape(Capsule())
        }
        .padding(.vertical, 16)
    }
}

struct AnimeHorizontalList: View {
    let title: String
    let animes: [Anime]
    var isLoading: Bool = false
    var onSeeAll: (() -> Void)?
    var onSelect: ((Anime) -> Void)?

    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            header

            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: 16) {
                    if isLoading {
                        ForEach(0..<5, id: \.self) { _ in
                            AnimeCardSkeleton()
                        }
                    } else {
                        ForEach(animes) { anime in
                            Button {
                                onSelect?(anime)
                            } label: {
                                AnimeCard(anime: anime)
                            }
                            .buttonStyle(.plain)
                        }
                    }
                }
                .padding(.horizontal)
            }
        }
    }

    private var header: some View {
        HStack {
            Text(title)
                .font(.title2)
                .fontWeight(.bold)
                .foregroundStyle(.white)

            Spacer()

            if let onSeeAll = onSeeAll {
                Button {
                    onSeeAll()
                } label: {
                    Text("See All")
                        .font(.subheadline)
                        .foregroundStyle(AppColors.primary)
                }
            }
        }
        .padding(.horizontal)
    }
}

struct AnimeCompactList: View {
    let animes: [Anime]
    var onSelect: ((Anime) -> Void)?

    var body: some View {
        LazyVStack(spacing: 12) {
            ForEach(animes) { anime in
                Button {
                    onSelect?(anime)
                } label: {
                    AnimeCardCompact(anime: anime)
                }
                .buttonStyle(.plain)
            }
        }
        .padding(.horizontal)
    }
}

#Preview {
    ZStack {
        AppGradients.background
            .ignoresSafeArea()

        ScrollView {
            VStack(spacing: 32) {
                AnimeHorizontalList(
                    title: "Trending",
                    animes: [],
                    isLoading: true
                )

                AnimeGrid(
                    animes: [],
                    isLoading: true
                )
            }
        }
    }
}
