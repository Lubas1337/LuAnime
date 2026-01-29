//
//  Episode.swift
//  mobile
//
//  LuAnime iOS App - Episode Model
//

import Foundation

struct Episode: Identifiable, Codable, Hashable {
    let position: Int
    let name: String?
    let url: String?
    let iframe: Bool?

    var id: Int { position }

    var displayName: String {
        if let name = name, !name.isEmpty {
            return name
        }
        return "Episode \(position)"
    }

    var episodeNumber: Int {
        position
    }

    var videoURL: URL? {
        guard let url = url else { return nil }
        return URL(string: url)
    }

    var isIframe: Bool {
        iframe ?? false
    }
}

struct EpisodeProgress: Codable, Hashable {
    let animeId: Int
    let episodeNumber: Int
    var progress: Double
    var updatedAt: Date

    enum CodingKeys: String, CodingKey {
        case animeId = "anime_id"
        case episodeNumber = "episode_number"
        case progress
        case updatedAt = "updated_at"
    }
}
