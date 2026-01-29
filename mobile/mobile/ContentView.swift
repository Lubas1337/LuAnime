//
//  ContentView.swift
//  mobile
//
//  LuAnime iOS App - Main Content View with iOS 26 Liquid Glass
//

import SwiftUI

struct ContentView: View {
    @State private var selectedTab: TabItem = .home
    @State private var authStore = AuthStore.shared
    @State private var favoritesStore = FavoritesStore.shared

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
                    HomeView()
                }

                Tab(TabItem.search.title, systemImage: selectedTab == .search ? TabItem.search.selectedIcon : TabItem.search.icon, value: .search) {
                    SearchView()
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
                HomeView()
                    .tag(TabItem.home)
                    .tabItem {
                        Label(TabItem.home.title, systemImage: selectedTab == .home ? TabItem.home.selectedIcon : TabItem.home.icon)
                    }

                SearchView()
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
}

struct FavoritesView: View {
    @State private var favoritesStore = FavoritesStore.shared
    @State private var selectedAnime: Anime?

    var body: some View {
        NavigationStack {
            ZStack {
                AppGradients.background
                    .ignoresSafeArea()

                if favoritesStore.favorites.isEmpty {
                    emptyState
                } else {
                    favoritesList
                }
            }
            .navigationTitle("Favorites")
            .navigationDestination(item: $selectedAnime) { anime in
                AnimeDetailView(anime: anime)
            }
        }
    }

    private var emptyState: some View {
        EmptyStateView(
            icon: "heart.slash",
            title: "No Favorites",
            message: "Add anime to your favorites to see them here",
            actionTitle: "Browse Anime"
        ) {
            // Navigate to search or home
        }
    }

    private var favoritesList: some View {
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

#Preview {
    ContentView()
}
