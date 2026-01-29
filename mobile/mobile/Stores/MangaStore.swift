//
//  MangaStore.swift
//  mobile
//
//  LuAnime iOS App - Manga Store (Favorites + Reading History)
//

import SwiftUI

@Observable
final class MangaStore {
    static let shared = MangaStore()

    var favorites: [MangaFavoriteItem] = []
    var readingHistory: [MangaReadingProgress] = []

    private let userDefaults = UserDefaults.standard

    private init() {
        loadFavorites()
        loadHistory()
    }

    // MARK: - Favorites

    func isFavorite(_ mangaId: String) -> Bool {
        favorites.contains { $0.mangaId == mangaId }
    }

    func toggleFavorite(manga: Manga) {
        if isFavorite(manga.id) {
            favorites.removeAll { $0.mangaId == manga.id }
        } else {
            let item = MangaFavoriteItem(mangaId: manga.id, addedAt: Date(), manga: manga)
            favorites.insert(item, at: 0)
        }
        saveFavorites()
    }

    // MARK: - Reading Progress

    func updateProgress(mangaId: String, chapterId: String, chapterNumber: String?, page: Int, totalPages: Int, manga: Manga?) {
        let progress = MangaReadingProgress(
            mangaId: mangaId,
            chapterId: chapterId,
            chapterNumber: chapterNumber,
            currentPage: page,
            totalPages: totalPages,
            updatedAt: Date(),
            manga: manga
        )

        if let index = readingHistory.firstIndex(where: { $0.mangaId == mangaId && $0.chapterId == chapterId }) {
            readingHistory[index] = progress
        } else {
            readingHistory.insert(progress, at: 0)
        }

        // Keep history limited
        if readingHistory.count > 200 {
            readingHistory = Array(readingHistory.prefix(200))
        }

        saveHistory()
    }

    func getProgress(mangaId: String, chapterId: String) -> MangaReadingProgress? {
        readingHistory.first { $0.mangaId == mangaId && $0.chapterId == chapterId }
    }

    func getLastRead(mangaId: String) -> MangaReadingProgress? {
        readingHistory
            .filter { $0.mangaId == mangaId }
            .sorted { $0.updatedAt > $1.updatedAt }
            .first
    }

    func getRecentHistory(limit: Int = 20) -> [MangaReadingProgress] {
        Array(
            readingHistory
                .sorted { $0.updatedAt > $1.updatedAt }
                .prefix(limit)
        )
    }

    var chaptersRead: Int {
        readingHistory.filter(\.isCompleted).count
    }

    // MARK: - Persistence

    private func loadFavorites() {
        guard let data = userDefaults.data(forKey: AppConstants.Storage.mangaFavoritesKey),
              let decoded = try? JSONDecoder().decode([MangaFavoriteItem].self, from: data) else {
            return
        }
        favorites = decoded
    }

    private func saveFavorites() {
        let items = favorites
        let key = AppConstants.Storage.mangaFavoritesKey
        Task.detached(priority: .utility) {
            guard let encoded = try? JSONEncoder().encode(items) else { return }
            await MainActor.run {
                UserDefaults.standard.set(encoded, forKey: key)
            }
        }
    }

    private func loadHistory() {
        guard let data = userDefaults.data(forKey: AppConstants.Storage.mangaHistoryKey),
              let decoded = try? JSONDecoder().decode([MangaReadingProgress].self, from: data) else {
            return
        }
        readingHistory = decoded
    }

    private func saveHistory() {
        let items = readingHistory
        let key = AppConstants.Storage.mangaHistoryKey
        Task.detached(priority: .utility) {
            guard let encoded = try? JSONEncoder().encode(items) else { return }
            await MainActor.run {
                UserDefaults.standard.set(encoded, forKey: key)
            }
        }
    }
}
