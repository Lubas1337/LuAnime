//
//  ContentView.swift
//  mobile
//
//  LuAnime iOS App - Main Content View with iOS 26 Liquid Glass
//

import SwiftUI

struct ContentView: View {
    @State private var selectedTab: TabItem = .home
    @State private var favoritesStore = FavoritesStore.shared
    @State private var modeStore = AppModeStore.shared

    var body: some View {
        ZStack {
            AppGradients.background
                .ignoresSafeArea()

            tabContent
        }
        .preferredColorScheme(.dark)
    }

    @ViewBuilder
    private var tabContent: some View {
        if #available(iOS 26.0, *) {
            // iOS 26 with Liquid Glass tab bar
            TabView(selection: $selectedTab) {
                Tab(TabItem.home.title, systemImage: selectedTab == .home ? TabItem.home.selectedIcon : TabItem.home.icon, value: .home) {
                    homeContent
                }

                Tab(TabItem.search.title, systemImage: selectedTab == .search ? TabItem.search.selectedIcon : TabItem.search.icon, value: .search, role: .search) {
                    searchContent
                }

                Tab(TabItem.favorites.title, systemImage: selectedTab == .favorites ? TabItem.favorites.selectedIcon : TabItem.favorites.icon, value: .favorites) {
                    FavoritesView()
                }

                Tab(TabItem.profile.title, systemImage: selectedTab == .profile ? TabItem.profile.selectedIcon : TabItem.profile.icon, value: .profile) {
                    ProfileView()
                }
            }
            .tabViewStyle(.sidebarAdaptable)
            .tint(AppColors.primary)
        } else {
            // Fallback for older iOS versions
            TabView(selection: $selectedTab) {
                homeContent
                    .tag(TabItem.home)
                    .tabItem {
                        Label(TabItem.home.title, systemImage: selectedTab == .home ? TabItem.home.selectedIcon : TabItem.home.icon)
                    }

                searchContent
                    .tag(TabItem.search)
                    .tabItem {
                        Label(TabItem.search.title, systemImage: selectedTab == .search ? TabItem.search.selectedIcon : TabItem.search.icon)
                    }

                FavoritesView()
                    .tag(TabItem.favorites)
                    .tabItem {
                        Label(TabItem.favorites.title, systemImage: selectedTab == .favorites ? TabItem.favorites.selectedIcon : TabItem.favorites.icon)
                    }

                ProfileView()
                    .tag(TabItem.profile)
                    .tabItem {
                        Label(TabItem.profile.title, systemImage: selectedTab == .profile ? TabItem.profile.selectedIcon : TabItem.profile.icon)
                    }
            }
            .tint(AppColors.primary)
        }
    }

    @ViewBuilder
    private var homeContent: some View {
        if modeStore.currentMode == .anime {
            HomeView()
        } else {
            MangaHomeView()
        }
    }

    @ViewBuilder
    private var searchContent: some View {
        if modeStore.currentMode == .anime {
            SearchView()
        } else {
            MangaSearchView()
        }
    }
}

enum FavoritesSubTab: CaseIterable {
    case favorites
    case history

    var title: String {
        switch self {
        case .favorites: return "Favorites"
        case .history: return "History"
        }
    }
}

struct FavoritesView: View {
    @State private var favoritesStore = FavoritesStore.shared
    @State private var mangaStore = MangaStore.shared
    @State private var modeStore = AppModeStore.shared
    @State private var selectedAnime: Anime?
    @State private var selectedManga: Manga?
    @State private var selectedSection: AppModeStore.AppMode = .anime
    @State private var selectedSubTab: FavoritesSubTab = .favorites

    var body: some View {
        NavigationStack {
            ZStack {
                AppGradients.background
                    .ignoresSafeArea()

                VStack(spacing: 0) {
                    // Anime/Manga picker
                    Picker("Section", selection: $selectedSection) {
                        Text("Anime").tag(AppModeStore.AppMode.anime)
                        Text("Manga").tag(AppModeStore.AppMode.manga)
                    }
                    .pickerStyle(.segmented)
                    .padding()

                    // Favorites/History sub-tab picker
                    subTabPicker

                    // Content
                    switch (selectedSection, selectedSubTab) {
                    case (.anime, .favorites):
                        animeFavorites
                    case (.anime, .history):
                        ScrollView {
                            HistoryTab(selectedAnime: $selectedAnime)
                                .padding()
                        }
                    case (.manga, .favorites):
                        mangaFavorites
                    case (.manga, .history):
                        ScrollView {
                            MangaHistoryTab(selectedManga: $selectedManga)
                                .padding()
                        }
                    }
                }
            }
            .navigationTitle("Favorites")
            .navigationDestination(item: $selectedAnime) { anime in
                AnimeDetailView(anime: anime)
            }
            .navigationDestination(item: $selectedManga) { manga in
                MangaDetailView(manga: manga)
            }
        }
    }

    private var subTabPicker: some View {
        HStack(spacing: 0) {
            ForEach(FavoritesSubTab.allCases, id: \.self) { tab in
                Button {
                    withAnimation(.smoothSpring) {
                        selectedSubTab = tab
                    }
                } label: {
                    VStack(spacing: 8) {
                        Text(tab.title)
                            .font(.subheadline)
                            .fontWeight(selectedSubTab == tab ? .semibold : .regular)
                            .foregroundStyle(selectedSubTab == tab ? .white : AppColors.textSecondary)

                        Rectangle()
                            .fill(selectedSubTab == tab ? AppColors.primary : .clear)
                            .frame(height: 2)
                    }
                }
                .frame(maxWidth: .infinity)
            }
        }
        .padding(.horizontal)
    }

    @ViewBuilder
    private var animeFavorites: some View {
        if favoritesStore.favorites.isEmpty {
            EmptyStateView(
                icon: "heart.slash",
                title: "No Anime Favorites",
                message: "Add anime to your favorites to see them here",
                actionTitle: "Browse Anime"
            ) {}
        } else {
            ScrollView {
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
                .padding()
            }
        }
    }

    @ViewBuilder
    private var mangaFavorites: some View {
        if mangaStore.favorites.isEmpty {
            EmptyStateView(
                icon: "heart.slash",
                title: "No Manga Favorites",
                message: "Add manga to your favorites to see them here",
                actionTitle: "Browse Manga"
            ) {}
        } else {
            ScrollView {
                LazyVStack(spacing: 12) {
                    ForEach(mangaStore.favorites) { item in
                        if let manga = item.manga {
                            Button {
                                selectedManga = manga
                            } label: {
                                MangaCardCompact(manga: manga)
                            }
                            .buttonStyle(.plain)
                        }
                    }
                }
                .padding()
            }
        }
    }
}

#Preview {
    ContentView()
}
