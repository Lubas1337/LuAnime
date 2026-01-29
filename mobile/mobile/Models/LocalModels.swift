//
//  LocalModels.swift
//  mobile
//
//  LuAnime iOS App - Local Storage Models
//

import Foundation

struct WatchHistoryItem: Identifiable, Codable, Hashable {
    var id: String { "\(animeId)-\(episodeNumber)" }
    let animeId: Int
    let episodeNumber: Int
    var progress: Double
    var updatedAt: Date
    var anime: Anime?

    enum CodingKeys: String, CodingKey {
        case animeId = "anime_id"
        case episodeNumber = "episode_number"
        case progress
        case updatedAt = "updated_at"
        case anime
    }
}

struct FavoriteItem: Identifiable, Codable, Hashable {
    var id: Int { animeId }
    let animeId: Int
    let addedAt: Date
    var anime: Anime?

    enum CodingKeys: String, CodingKey {
        case animeId = "anime_id"
        case addedAt = "added_at"
        case anime
    }
}
