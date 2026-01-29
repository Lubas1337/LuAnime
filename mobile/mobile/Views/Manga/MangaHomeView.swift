//
//  MangaHomeView.swift
//  mobile
//
//  LuAnime iOS App - Manga Home View
//

import SwiftUI

struct MangaHomeView: View {
    @State private var popularManga: [Manga] = []
    @State private var recentlyUpdated: [Manga] = []
    @State private var isLoading = true
    @State private var error: String?
    @State private var selectedManga: Manga?

    var body: some View {
        NavigationStack {
            ZStack {
                AppGradients.background
                    .ignoresSafeArea()

                ContentLoadingView(
                    isLoading: isLoading,
                    error: error,
                    retryAction: {
                        Task { await loadData() }
                    }
                ) {
                    content
                }
            }
            .navigationDestination(item: $selectedManga) { manga in
                MangaDetailView(manga: manga)
            }
            .toolbar {
                ToolbarItem(placement: .principal) {
                    ModeSelector(modeStore: AppModeStore.shared)
                }
            }
        }
        .task {
            await loadData()
        }
    }

    private var content: some View {
        ScrollView(showsIndicators: false) {
            VStack(spacing: 32) {
                // Hero banner with first popular manga
                if let hero = popularManga.first {
                    mangaHeroBanner(hero)
                }

                // Trending section
                if !popularManga.isEmpty {
                    MangaHorizontalList(
                        title: "Trending",
                        mangas: popularManga
                    ) { manga in
                        selectedManga = manga
                    }
                }

                // Recently Updated section
                if !recentlyUpdated.isEmpty {
                    MangaHorizontalList(
                        title: "Recently Updated",
                        mangas: recentlyUpdated
                    ) { manga in
                        selectedManga = manga
                    }
                }

                Spacer(minLength: 100)
            }
            .padding(.top)
        }
    }

    private func mangaHeroBanner(_ manga: Manga) -> some View {
        Button {
            selectedManga = manga
        } label: {
            ZStack(alignment: .bottomLeading) {
                AnimePosterImage(
                    url: manga.posterURL,
                    cornerRadius: 24
                )
                .frame(height: 300)
                .frame(maxWidth: .infinity)
                .clipped()

                LinearGradient(
                    colors: [.clear, .black.opacity(0.8)],
                    startPoint: .center,
                    endPoint: .bottom
                )
                .clipShape(RoundedRectangle(cornerRadius: 24))

                VStack(alignment: .leading, spacing: 8) {
                    if let status = manga.status {
                        Text(manga.statusDisplay)
                            .font(.caption)
                            .fontWeight(.semibold)
                            .foregroundStyle(.white)
                            .padding(.horizontal, 10)
                            .padding(.vertical, 4)
                            .liquidGlassCapsule()
                    }

                    Text(manga.displayTitle)
                        .font(.title2)
                        .fontWeight(.bold)
                        .foregroundStyle(.white)
                        .lineLimit(2)

                    if let typeName = manga.typeName {
                        Text(typeName)
                            .font(.subheadline)
                            .foregroundStyle(.white.opacity(0.7))
                    }
                }
                .padding(24)
            }
            .clipShape(RoundedRectangle(cornerRadius: 24))
            .padding(.horizontal)
        }
        .buttonStyle(.plain)
    }

    @MainActor
    private func loadData() async {
        isLoading = true
        error = nil

        do {
            async let popular = ReMangaService.shared.getPopularManga(count: 15)
            async let recent = ReMangaService.shared.getRecentlyUpdated(count: 15)

            popularManga = try await popular
            recentlyUpdated = try await recent
            isLoading = false
        } catch {
            self.error = error.localizedDescription
            isLoading = false
        }
    }
}

#Preview {
    MangaHomeView()
}
