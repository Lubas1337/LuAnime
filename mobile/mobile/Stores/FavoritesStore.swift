//
//  FavoritesStore.swift
//  mobile
//
//  LuAnime iOS App - Favorites Store
//

import SwiftUI

@Observable
final class FavoritesStore {
    static let shared = FavoritesStore()

    var favorites: [FavoriteItem] = []
    var isLoading = false
    var error: String?

    private let storageKey = AppConstants.Storage.favoritesKey
    private let userDefaults = UserDefaults.standard

    private init() {
        loadFromStorage()
    }

    // MARK: - Local Storage

    private func loadFromStorage() {
        guard let data = userDefaults.data(forKey: storageKey),
              let decoded = try? JSONDecoder().decode([FavoriteItem].self, from: data) else {
            return
        }
        favorites = decoded
    }

    private func saveToStorage() {
        // Capture data for background encoding
        let favoritesToSave = favorites
        let key = storageKey

        // Perform JSON encoding in background thread to avoid blocking main thread
        Task.detached(priority: .utility) {
            guard let encoded = try? JSONEncoder().encode(favoritesToSave) else { return }
            await MainActor.run {
                UserDefaults.standard.set(encoded, forKey: key)
            }
        }
    }

    // MARK: - Favorite Operations

    func isFavorite(_ animeId: Int) -> Bool {
        favorites.contains { $0.animeId == animeId }
    }

    func addFavorite(anime: Anime) {
        guard !isFavorite(anime.id) else { return }

        let item = FavoriteItem(animeId: anime.id, addedAt: Date(), anime: anime)
        favorites.insert(item, at: 0)
        saveToStorage()
    }

    func removeFavorite(animeId: Int) {
        favorites.removeAll { $0.animeId == animeId }
        saveToStorage()
    }

    func toggleFavorite(anime: Anime) {
        if isFavorite(anime.id) {
            removeFavorite(animeId: anime.id)
        } else {
            addFavorite(anime: anime)
        }
    }

    func getFavoriteAnime() -> [Anime] {
        favorites.compactMap { $0.anime }
    }

    func clearAll() {
        favorites.removeAll()
        saveToStorage()
    }
}
