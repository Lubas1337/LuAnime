//
//  Translation.swift
//  mobile
//
//  LuAnime iOS App - Translation/Voiceover Model
//

import Foundation

struct Translation: Identifiable, Codable, Hashable {
    let id: Int
    let name: String?
    let icon: String?
    let episodesCount: Int?
    let isSub: Bool?

    enum CodingKeys: String, CodingKey {
        case id, name, icon
        case episodesCount = "episodes_count"
        case isSub = "is_sub"
    }

    var displayName: String {
        name ?? "Translation \(id)"
    }

    var displayType: String {
        if isSub == true {
            return "SUB"
        }
        return "DUB"
    }
}

struct VideoSource: Identifiable, Codable, Hashable {
    let id: Int
    let name: String?
    let type: SourceType?
    let episodesCount: Int?

    enum CodingKeys: String, CodingKey {
        case id, name, type
        case episodesCount = "episodes_count"
    }

    init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        id = try container.decode(Int.self, forKey: .id)
        name = try container.decodeIfPresent(String.self, forKey: .name)
        episodesCount = try container.decodeIfPresent(Int.self, forKey: .episodesCount)

        // Handle type as either object or number (reference ID)
        if let typeObject = try? container.decodeIfPresent(SourceType.self, forKey: .type) {
            type = typeObject
        } else if let _ = try? container.decodeIfPresent(Int.self, forKey: .type) {
            // Type is just a reference ID, create a placeholder
            type = nil
        } else {
            type = nil
        }
    }

    func encode(to encoder: Encoder) throws {
        var container = encoder.container(keyedBy: CodingKeys.self)
        try container.encode(id, forKey: .id)
        try container.encodeIfPresent(name, forKey: .name)
        try container.encodeIfPresent(type, forKey: .type)
        try container.encodeIfPresent(episodesCount, forKey: .episodesCount)
    }

    var displayName: String {
        name ?? type?.name ?? "Source \(id)"
    }
}

struct SourceType: Codable, Hashable {
    let id: Int
    let name: String
    let icon: String?
}
