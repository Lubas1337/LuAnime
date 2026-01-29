//
//  ProfileView.swift
//  mobile
//
//  LuAnime iOS App - Profile View
//

import SwiftUI

struct ProfileView: View {
    @State private var selectedTab: ProfileTab = .favorites

    var body: some View {
        NavigationStack {
            ZStack {
                AppGradients.background
                    .ignoresSafeArea()

                ScrollView(showsIndicators: false) {
                    VStack(spacing: 24) {
                        statsSection
                        tabSection
                        contentSection
                        Spacer(minLength: 100)
                    }
                    .padding()
                }
            }
            .navigationTitle("Profile")
        }
    }

    private var statsSection: some View {
        HStack(spacing: 16) {
            StatCard(
                icon: "heart.fill",
                value: "\(FavoritesStore.shared.favorites.count)",
                label: "Favorites",
                color: AppColors.error
            )

            StatCard(
                icon: "play.fill",
                value: "\(PlayerStore.shared.watchHistory.count)",
                label: "Watched",
                color: AppColors.primary
            )

            StatCard(
                icon: "book.fill",
                value: "\(MangaStore.shared.chaptersRead)",
                label: "Chapters",
                color: AppColors.success
            )
        }
    }

    private var tabSection: some View {
        HStack(spacing: 0) {
            ForEach(ProfileTab.allCases, id: \.self) { tab in
                Button {
                    withAnimation(.smoothSpring) {
                        selectedTab = tab
                    }
                } label: {
                    VStack(spacing: 8) {
                        Text(tab.title)
                            .font(.subheadline)
                            .fontWeight(selectedTab == tab ? .semibold : .regular)
                            .foregroundStyle(selectedTab == tab ? .white : AppColors.textSecondary)

                        Rectangle()
                            .fill(selectedTab == tab ? AppColors.primary : .clear)
                            .frame(height: 2)
                    }
                }
                .frame(maxWidth: .infinity)
            }
        }
    }

    @ViewBuilder
    private var contentSection: some View {
        switch selectedTab {
        case .favorites:
            FavoritesTab()
        case .history:
            HistoryTab()
        }
    }
}

// MARK: - Supporting Types

enum ProfileTab: CaseIterable {
    case favorites
    case history

    var title: String {
        switch self {
        case .favorites: return "Favorites"
        case .history: return "History"
        }
    }
}

struct StatCard: View {
    let icon: String
    let value: String
    let label: String
    let color: Color

    var body: some View {
        VStack(spacing: 8) {
            HStack(spacing: 8) {
                Image(systemName: icon)
                    .foregroundStyle(color)
                Text(value)
                    .font(.title2)
                    .fontWeight(.bold)
            }
            .foregroundStyle(.white)

            Text(label)
                .font(.caption)
                .foregroundStyle(AppColors.textSecondary)
        }
        .frame(maxWidth: .infinity)
        .padding(16)
        .liquidGlass(cornerRadius: AppConstants.Layout.cornerRadius)
    }
}

#Preview {
    ProfileView()
}
