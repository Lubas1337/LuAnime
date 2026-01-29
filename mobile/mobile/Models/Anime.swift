//
//  Anime.swift
//  mobile
//
//  LuAnime iOS App - Anime Model
//

import Foundation

struct Anime: Identifiable, Codable, Hashable {
    let id: Int
    let titleRu: String?
    let titleEn: String?
    let titleOriginal: String?
    let titleAlt: String?
    let poster: String?
    let image: String?
    let rating: Int?
    let grade: Double?
    let episodesTotal: Int?
    let episodesReleased: Int?
    let genres: String?
    let country: String?
    let status: AnimeStatus?
    let year: String?
    let duration: Int?
    let category: Category?
    let description: String?
    let broadcast: Int?
    let screenshots: [String]?
    let source: String?
    let director: String?
    let studio: String?
    let season: Int?

    enum CodingKeys: String, CodingKey {
        case id
        case titleRu = "title_ru"
        case titleEn = "title_en"
        case titleOriginal = "title_original"
        case titleAlt = "title_alt"
        case poster, image, rating, grade
        case episodesTotal = "episodes_total"
        case episodesReleased = "episodes_released"
        case genres, country, status, year, duration, category
        case description, broadcast, screenshots, source, director, studio, season
    }

    var displayTitle: String {
        titleRu ?? titleEn ?? titleOriginal ?? "Unknown"
    }

    var posterURL: URL? {
        // First try image field
        if let image = image, !image.isEmpty {
            // Check if it's already a full URL
            if image.hasPrefix("http://") || image.hasPrefix("https://") {
                return URL(string: image)
            }
            // Otherwise construct URL from image ID
            return URL(string: "https://s.anixmirai.com/posters/\(image).jpg")
        }
        // Fallback to poster field
        if let poster = poster, !poster.isEmpty {
            if poster.hasPrefix("http://") || poster.hasPrefix("https://") {
                return URL(string: poster)
            }
            return URL(string: "https://s.anixmirai.com/posters/\(poster).jpg")
        }
        return nil
    }

    var imageURL: URL? {
        posterURL
    }

    var displayRating: String {
        if let grade = grade {
            return String(format: "%.1f", grade)
        }
        return "N/A"
    }

    var ratingValue: Double {
        grade ?? 0
    }

    var episodesInfo: String {
        let released = episodesReleased ?? 0
        let total = episodesTotal ?? 0
        if total > 0 {
            return "\(released)/\(total)"
        }
        return "\(released)"
    }

    var genresList: [String] {
        genres?.components(separatedBy: ", ") ?? []
    }

    var yearInt: Int? {
        if let year = year {
            return Int(year)
        }
        return nil
    }

    func hash(into hasher: inout Hasher) {
        hasher.combine(id)
    }

    static func == (lhs: Anime, rhs: Anime) -> Bool {
        lhs.id == rhs.id
    }
}

struct Category: Identifiable, Codable, Hashable {
    let id: Int
    let name: String
}

struct AnimeStatus: Codable, Hashable {
    let id: Int
    let name: String
}

struct RelatedAnime: Identifiable, Codable, Hashable {
    let id: Int
    let titleRu: String?
    let poster: String?
    let image: String?

    enum CodingKeys: String, CodingKey {
        case id
        case titleRu = "title_ru"
        case poster, image
    }

    var displayTitle: String {
        titleRu ?? "Related"
    }

    var posterURL: URL? {
        if let image = image, !image.isEmpty {
            if image.hasPrefix("http://") || image.hasPrefix("https://") {
                return URL(string: image)
            }
            return URL(string: "https://s.anixmirai.com/posters/\(image).jpg")
        }
        if let poster = poster, !poster.isEmpty {
            if poster.hasPrefix("http://") || poster.hasPrefix("https://") {
                return URL(string: poster)
            }
            return URL(string: "https://s.anixmirai.com/posters/\(poster).jpg")
        }
        return nil
    }
}

struct ScheduleAnime: Identifiable, Codable, Hashable {
    let id: Int
    let titleRu: String?
    let poster: String?
    let image: String?
    let episodesReleased: Int?
    let episodesTotal: Int?
    let grade: Double?

    enum CodingKeys: String, CodingKey {
        case id
        case titleRu = "title_ru"
        case poster, image
        case episodesReleased = "episodes_released"
        case episodesTotal = "episodes_total"
        case grade
    }

    var displayTitle: String {
        titleRu ?? "Unknown"
    }

    var posterURL: URL? {
        if let image = image, !image.isEmpty {
            if image.hasPrefix("http://") || image.hasPrefix("https://") {
                return URL(string: image)
            }
            return URL(string: "https://s.anixmirai.com/posters/\(image).jpg")
        }
        if let poster = poster, !poster.isEmpty {
            if poster.hasPrefix("http://") || poster.hasPrefix("https://") {
                return URL(string: poster)
            }
            return URL(string: "https://s.anixmirai.com/posters/\(poster).jpg")
        }
        return nil
    }
}

struct DiscoverItem: Identifiable, Codable, Hashable {
    let id: Int
    let title: String?
    let description: String?
    let image: String?
    let type: Int?  // API returns Int, not String
    let action: String?

    var imageURL: URL? {
        guard let image = image, !image.isEmpty else { return nil }
        // Check if it's already a full URL
        if image.hasPrefix("http://") || image.hasPrefix("https://") {
            return URL(string: image)
        }
        // Otherwise construct URL from image ID
        return URL(string: "https://s.anixmirai.com/posters/\(image).jpg")
    }
}
