//
//  ProfileView.swift
//  mobile
//
//  LuAnime iOS App - Profile View
//

import SwiftUI

struct ProfileView: View {
    @State private var authStore = AuthStore.shared
    @State private var showLoginSheet = false
    @State private var showRegisterSheet = false
    @State private var selectedTab: ProfileTab = .favorites

    var body: some View {
        NavigationStack {
            ZStack {
                AppGradients.background
                    .ignoresSafeArea()

                if authStore.isAuthenticated {
                    authenticatedView
                } else {
                    guestView
                }
            }
            .sheet(isPresented: $showLoginSheet) {
                LoginSheet()
            }
            .sheet(isPresented: $showRegisterSheet) {
                RegisterSheet()
            }
        }
    }

    // MARK: - Authenticated View

    private var authenticatedView: some View {
        ScrollView(showsIndicators: false) {
            VStack(spacing: 24) {
                profileHeader
                statsSection
                tabSection
                contentSection
                logoutButton
                Spacer(minLength: 100)
            }
            .padding()
        }
    }

    private var profileHeader: some View {
        VStack(spacing: 16) {
            if let avatarURL = authStore.user?.avatarURL {
                CachedAsyncImage(url: avatarURL) { image in
                    image
                        .resizable()
                        .aspectRatio(contentMode: .fill)
                } placeholder: {
                    Circle()
                        .fill(AppColors.surface)
                        .overlay {
                            Text(authStore.user?.initials ?? "?")
                                .font(.title)
                                .fontWeight(.bold)
                                .foregroundStyle(.white)
                        }
                }
                .frame(width: AppConstants.Layout.avatarSize, height: AppConstants.Layout.avatarSize)
                .clipShape(Circle())
                .overlay {
                    Circle()
                        .strokeBorder(AppColors.primary, lineWidth: 3)
                }
            } else {
                Circle()
                    .fill(AppColors.surface)
                    .frame(width: AppConstants.Layout.avatarSize, height: AppConstants.Layout.avatarSize)
                    .overlay {
                        Text(authStore.user?.initials ?? "?")
                            .font(.title)
                            .fontWeight(.bold)
                            .foregroundStyle(.white)
                    }
                    .overlay {
                        Circle()
                            .strokeBorder(AppColors.primary, lineWidth: 3)
                    }
            }

            VStack(spacing: 4) {
                Text(authStore.user?.displayName ?? "User")
                    .font(.title2)
                    .fontWeight(.bold)
                    .foregroundStyle(.white)

                if authStore.user?.isPremium == true {
                    HStack(spacing: 4) {
                        Image(systemName: "crown.fill")
                            .foregroundStyle(AppColors.warning)
                        Text("Premium")
                            .fontWeight(.medium)
                    }
                    .font(.caption)
                    .foregroundStyle(AppColors.warning)
                }
            }
        }
        .padding(.top, 24)
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

    private var logoutButton: some View {
        GlassButton("Logout", icon: "rectangle.portrait.and.arrow.right", style: .destructive) {
            authStore.logout()
        }
    }

    // MARK: - Guest View

    private var guestView: some View {
        VStack(spacing: 32) {
            Spacer()

            VStack(spacing: 16) {
                Image(systemName: "person.crop.circle")
                    .font(.system(size: 80))
                    .foregroundStyle(AppColors.textTertiary)

                Text("Welcome to LuAnime")
                    .font(.title2)
                    .fontWeight(.bold)
                    .foregroundStyle(.white)

                Text("Sign in to sync your favorites and watch history across devices")
                    .font(.subheadline)
                    .foregroundStyle(AppColors.textSecondary)
                    .multilineTextAlignment(.center)
                    .padding(.horizontal, 32)
            }

            VStack(spacing: 12) {
                GlassButton("Sign In", icon: "person.fill", style: .primary) {
                    showLoginSheet = true
                }

                GlassButton("Create Account", style: .secondary) {
                    showRegisterSheet = true
                }
            }
            .padding(.horizontal, 24)

            Spacer()
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
