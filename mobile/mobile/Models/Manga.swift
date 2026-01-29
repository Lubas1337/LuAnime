//
//  Manga.swift
//  mobile
//
//  LuAnime iOS App - Manga Model (ReManga)
//

import Foundation

struct Manga: Identifiable, Codable, Hashable {
    let id: String               // dir (slug) — used as unique ID
    let mainName: String?        // Russian title
    let secondaryName: String?   // English title
    let anotherName: String?     // Original title
    let description: String?     // HTML description
    let status: String?          // status.name
    let translateStatus: String? // translate_status.name
    let year: Int?               // issue_year
    let avgRating: String?
    let totalViews: Int?
    let countChapters: Int?
    let coverPath: String?       // relative path to cover (high)
    let typeName: String?        // Манга/Манхва/Маньхуа
    let genres: [MangaTag]?
    let branchId: Int?           // first branch ID for chapters

    var displayTitle: String {
        secondaryName ?? mainName ?? "Unknown"
    }

    var posterURL: URL? {
        guard let coverPath else { return nil }
        return URL(string: "https://api.remanga.org\(coverPath)")
    }

    var genresList: [String] {
        genres?.map(\.name) ?? []
    }

    var statusDisplay: String {
        guard let status else { return "Unknown" }
        switch status {
        case "Продолжается": return "Ongoing"
        case "Завершён", "Завершено": return "Completed"
        case "Заморожен": return "Hiatus"
        case "Заброшен": return "Dropped"
        default: return status
        }
    }

    var statusColor: String {
        switch statusDisplay {
        case "Ongoing": return "success"
        case "Completed": return "primary"
        case "Hiatus": return "warning"
        case "Dropped": return "error"
        default: return "secondary"
        }
    }

    var ratingValue: Double? {
        guard let avgRating else { return nil }
        return Double(avgRating)
    }

    /// Strip HTML tags from description
    var cleanDescription: String? {
        guard let description else { return nil }
        return description.replacingOccurrences(of: "<[^>]+>", with: "", options: .regularExpression)
            .trimmingCharacters(in: .whitespacesAndNewlines)
    }
}

struct MangaTag: Identifiable, Codable, Hashable {
    let id: String
    let name: String
}

// MARK: - ReManga JSON Parsing

extension Manga {
    /// Parse from ReManga title list item (/api/v2/titles/ or /api/v2/search/)
    static func from(remangaData: [String: Any]) -> Manga? {
        guard let dir = remangaData["dir"] as? String else {
            return nil
        }

        let mainName = remangaData["main_name"] as? String
        let secondaryName = remangaData["secondary_name"] as? String
        let anotherName = remangaData["another_name"] as? String
        let description = remangaData["description"] as? String
        let year = remangaData["issue_year"] as? Int
        let avgRating = remangaData["avg_rating"] as? String
        let totalViews = remangaData["total_views"] as? Int
        let countChapters = remangaData["count_chapters"] as? Int

        // Status
        let statusObj = remangaData["status"] as? [String: Any]
        let status = statusObj?["name"] as? String

        let translateStatusObj = remangaData["translate_status"] as? [String: Any]
        let translateStatus = translateStatusObj?["name"] as? String

        // Type
        let typeObj = remangaData["type"] as? [String: Any]
        let typeName = typeObj?["name"] as? String

        // Cover
        let coverObj = remangaData["cover"] as? [String: String]
        let coverPath = coverObj?["high"] ?? coverObj?["mid"] ?? coverObj?["low"]

        // Genres
        var genres: [MangaTag] = []
        if let rawGenres = remangaData["genres"] as? [[String: Any]] {
            for g in rawGenres {
                if let gId = g["id"] as? Int,
                   let gName = g["name"] as? String {
                    genres.append(MangaTag(id: String(gId), name: gName))
                }
            }
        }

        // Categories (also treated as tags)
        if let rawCategories = remangaData["categories"] as? [[String: Any]] {
            for c in rawCategories {
                if let cId = c["id"] as? Int,
                   let cName = c["name"] as? String {
                    genres.append(MangaTag(id: "cat_\(cId)", name: cName))
                }
            }
        }

        // Branch ID (from detail response)
        var branchId: Int?
        if let branches = remangaData["branches"] as? [[String: Any]],
           let firstBranch = branches.first {
            branchId = firstBranch["id"] as? Int
        }

        return Manga(
            id: dir,
            mainName: mainName,
            secondaryName: secondaryName,
            anotherName: anotherName,
            description: description,
            status: status,
            translateStatus: translateStatus,
            year: year,
            avgRating: avgRating,
            totalViews: totalViews,
            countChapters: countChapters,
            coverPath: coverPath,
            typeName: typeName,
            genres: genres.isEmpty ? nil : genres,
            branchId: branchId
        )
    }

    /// Parse array from /api/v2/titles/ response: { "titles": [...] }
    static func fromTitlesResponse(_ json: [String: Any]) -> [Manga] {
        guard let titles = json["titles"] as? [[String: Any]] else {
            return []
        }
        return titles.compactMap { Manga.from(remangaData: $0) }
    }

    /// Parse array from /api/v2/search/ response: { "results": [...] }
    static func fromSearchResponse(_ json: [String: Any]) -> [Manga] {
        guard let results = json["results"] as? [[String: Any]] else {
            return []
        }
        return results.compactMap { Manga.from(remangaData: $0) }
    }
}
