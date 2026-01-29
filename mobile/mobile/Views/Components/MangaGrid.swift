//
//  MangaGrid.swift
//  mobile
//
//  LuAnime iOS App - Manga Grid Component
//

import SwiftUI

struct MangaGrid: View {
    let mangas: [Manga]
    var columns: Int = 2
    var isLoading: Bool = false
    var onSelect: ((Manga) -> Void)?

    private var gridColumns: [GridItem] {
        Array(repeating: GridItem(.flexible(), spacing: 16), count: columns)
    }

    var body: some View {
        LazyVGrid(columns: gridColumns, spacing: 20) {
            ForEach(mangas) { manga in
                Button {
                    onSelect?(manga)
                } label: {
                    MangaCard(manga: manga)
                }
                .buttonStyle(.plain)
            }

            if isLoading {
                ForEach(0..<columns, id: \.self) { _ in
                    MangaCardSkeleton()
                }
            }
        }
        .padding(.horizontal)
    }
}

struct MangaHorizontalList: View {
    let title: String
    let mangas: [Manga]
    var isLoading: Bool = false
    var onSeeAll: (() -> Void)?
    var onSelect: ((Manga) -> Void)?

    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            header

            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: 16) {
                    if isLoading {
                        ForEach(0..<5, id: \.self) { _ in
                            MangaCardSkeleton()
                        }
                    } else {
                        ForEach(mangas) { manga in
                            Button {
                                onSelect?(manga)
                            } label: {
                                MangaCard(manga: manga)
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

            if let onSeeAll {
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

#Preview {
    ZStack {
        AppGradients.background
            .ignoresSafeArea()
        MangaGrid(mangas: [], isLoading: true)
    }
}
