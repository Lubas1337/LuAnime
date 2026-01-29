//
//  User.swift
//  mobile
//
//  LuAnime iOS App - User Model
//

import Foundation

struct User: Identifiable, Codable, Hashable {
    let id: Int
    let login: String
    let email: String?
    let avatar: String?
    let status: String?
    let isPremium: Bool?
    let createdAt: String?
    let lastOnline: String?

    enum CodingKeys: String, CodingKey {
        case id, login, email, avatar, status
        case isPremium = "is_premium"
        case createdAt = "created_at"
        case lastOnline = "last_online"
    }

    var avatarURL: URL? {
        guard let avatar = avatar else { return nil }
        return URL(string: avatar)
    }

    var displayName: String {
        login
    }

    var initials: String {
        let components = login.components(separatedBy: " ")
        if components.count >= 2 {
            return String(components[0].prefix(1) + components[1].prefix(1)).uppercased()
        }
        return String(login.prefix(2)).uppercased()
    }
}

struct AuthResponse: Codable {
    let profileToken: String?
    let profile: User?
    let code: Int?
    let error: String?

    enum CodingKeys: String, CodingKey {
        case profileToken = "profileToken"
        case profile, code, error
    }

    var isSuccess: Bool {
        code == 0 || profileToken != nil
    }
}

struct LoginCredentials: Codable {
    let login: String
    let password: String
}

struct RegisterCredentials: Codable {
    let login: String
    let email: String
    let password: String
}

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
