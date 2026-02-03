//
//  Constants.swift
//  mobile
//
//  LuAnime iOS App - Constants
//

import SwiftUI

enum AppConstants {
    static let appName = "LuAnime"
    static let appVersion = "1.0.0"

    enum API {
        static let baseURL = "https://api.anixart.tv"
        static let timeout: TimeInterval = 30
    }

    enum Storage {
        static let favoritesKey = "local_favorites"
        static let historyKey = "watch_history"
        static let mangaFavoritesKey = "manga_favorites"
        static let mangaHistoryKey = "manga_reading_history"
        static let appModeKey = "app_mode"
        static let downloadedEpisodesKey = "downloaded_episodes"
        static let downloadedMangaChaptersKey = "downloaded_manga_chapters"
    }

    enum ReManga {
        static let baseURL = "https://api.remanga.org/api/v2"
        static let mediaBaseURL = "https://api.remanga.org"
    }

    enum Animation {
        static let defaultDuration: Double = 0.3
        static let springResponse: Double = 0.4
        static let springDamping: Double = 0.8
    }

    enum Layout {
        static let cornerRadius: CGFloat = 16
        static let cardCornerRadius: CGFloat = 20
        static let padding: CGFloat = 16
        static let spacing: CGFloat = 12
        static let iconSize: CGFloat = 24
        static let avatarSize: CGFloat = 80
        static let cardWidth: CGFloat = 150
        static let cardHeight: CGFloat = 220
        static let bannerHeight: CGFloat = 400
        static let readerPageSpacing: CGFloat = 2
    }
}

enum AppColors {
    static let primary = Color(hex: "8B5CF6")
    static let primaryLight = Color(hex: "A78BFA")
    static let primaryDark = Color(hex: "7C3AED")

    static let background = Color(hex: "0A0A0F")
    static let backgroundSecondary = Color(hex: "1A1A2E")
    static let backgroundTertiary = Color(hex: "16213E")

    static let surface = Color.white.opacity(0.05)
    static let surfaceElevated = Color.white.opacity(0.08)

    static let textPrimary = Color.white
    static let textSecondary = Color.white.opacity(0.7)
    static let textTertiary = Color.white.opacity(0.5)

    static let glassTint = Color(hex: "8B5CF6").opacity(0.2)
    static let glassBackground = Color.white.opacity(0.1)

    static let success = Color(hex: "10B981")
    static let warning = Color(hex: "F59E0B")
    static let error = Color(hex: "EF4444")

    static let rating = Color(hex: "FBBF24")
}

enum AppGradients {
    static let primary = LinearGradient(
        colors: [AppColors.primary, AppColors.primaryDark],
        startPoint: .topLeading,
        endPoint: .bottomTrailing
    )

    static let background = LinearGradient(
        colors: [AppColors.background, AppColors.backgroundSecondary],
        startPoint: .top,
        endPoint: .bottom
    )

    static let card = LinearGradient(
        colors: [AppColors.surface, AppColors.surfaceElevated],
        startPoint: .top,
        endPoint: .bottom
    )

    static let overlay = LinearGradient(
        colors: [.clear, .black.opacity(0.8)],
        startPoint: .top,
        endPoint: .bottom
    )
}

