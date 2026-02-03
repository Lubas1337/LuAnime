//
//  PlayerStore.swift
//  mobile
//
//  LuAnime iOS App - Player Store
//

import SwiftUI
import AVKit

@Observable
final class PlayerStore {
    static let shared = PlayerStore()

    var currentAnime: Anime?
    var currentEpisode: Episode?
    var currentTranslation: Translation?
    var currentSource: VideoSource?

    var playerState = PlayerState()
    var watchHistory: [WatchHistoryItem] = []
    var isLoading = false
    var error: String?

    private let storageKey = AppConstants.Storage.historyKey
    private let userDefaults = UserDefaults.standard

    private init() {
        loadHistory()
    }

    // MARK: - History Management

    private func loadHistory() {
        guard let data = userDefaults.data(forKey: storageKey),
              let decoded = try? JSONDecoder().decode([WatchHistoryItem].self, from: data) else {
            return
        }
        watchHistory = decoded
    }

    private func saveHistory() {
        // Capture data for background encoding
        let historyToSave = watchHistory
        let key = storageKey

        // Perform JSON encoding in background thread to avoid blocking main thread
        Task.detached(priority: .utility) {
            guard let encoded = try? JSONEncoder().encode(historyToSave) else { return }
            await MainActor.run {
                UserDefaults.standard.set(encoded, forKey: key)
            }
        }
    }

    func updateProgress(animeId: Int, episodeNumber: Int, progress: Double, anime: Anime? = nil) {
        if let index = watchHistory.firstIndex(where: { $0.animeId == animeId && $0.episodeNumber == episodeNumber }) {
            watchHistory[index].progress = progress
            watchHistory[index].updatedAt = Date()
            if let anime = anime {
                watchHistory[index].anime = anime
            }
        } else {
            let item = WatchHistoryItem(
                animeId: animeId,
                episodeNumber: episodeNumber,
                progress: progress,
                updatedAt: Date(),
                anime: anime
            )
            watchHistory.insert(item, at: 0)
        }

        if watchHistory.count > 100 {
            watchHistory = Array(watchHistory.prefix(100))
        }

        saveHistory()
    }

    func getProgress(animeId: Int, episodeNumber: Int) -> Double? {
        watchHistory.first { $0.animeId == animeId && $0.episodeNumber == episodeNumber }?.progress
    }

    func getLastWatched(animeId: Int) -> WatchHistoryItem? {
        watchHistory
            .filter { $0.animeId == animeId }
            .sorted { $0.updatedAt > $1.updatedAt }
            .first
    }

    func getRecentHistory(limit: Int = 20) -> [WatchHistoryItem] {
        Array(watchHistory.sorted { $0.updatedAt > $1.updatedAt }.prefix(limit))
    }

    func clearHistory() {
        watchHistory.removeAll()
        saveHistory()
    }

    func removeFromHistory(animeId: Int, episodeNumber: Int) {
        watchHistory.removeAll { $0.animeId == animeId && $0.episodeNumber == episodeNumber }
        saveHistory()
    }

    func removeAnimeFromHistory(animeId: Int) {
        watchHistory.removeAll { $0.animeId == animeId }
        saveHistory()
    }

    func getRecentHistoryGroupedByAnime(limit: Int = 20) -> [WatchHistoryItem] {
        var seen = Set<Int>()
        var result: [WatchHistoryItem] = []
        for item in watchHistory.sorted(by: { $0.updatedAt > $1.updatedAt }) {
            if seen.insert(item.animeId).inserted {
                result.append(item)
            }
            if result.count >= limit { break }
        }
        return result
    }

    // MARK: - Player State

    func setCurrentPlayback(anime: Anime, episode: Episode, translation: Translation?, source: VideoSource?) {
        currentAnime = anime
        currentEpisode = episode
        currentTranslation = translation
        currentSource = source
        playerState = PlayerState()
    }

    func clearPlayback() {
        currentAnime = nil
        currentEpisode = nil
        currentTranslation = nil
        currentSource = nil
        playerState = PlayerState()
    }

    func updatePlayerState(currentTime: Double, duration: Double, isPlaying: Bool) {
        playerState.currentTime = currentTime
        playerState.duration = duration
        playerState.isPlaying = isPlaying

        if let anime = currentAnime, let episode = currentEpisode {
            updateProgress(
                animeId: anime.id,
                episodeNumber: episode.episodeNumber,
                progress: playerState.progress,
                anime: anime
            )
        }
    }
}
