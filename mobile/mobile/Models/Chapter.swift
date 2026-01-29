//
//  Chapter.swift
//  mobile
//
//  LuAnime iOS App - Chapter Model (ReManga)
//

import Foundation

struct Chapter: Identifiable, Codable, Hashable {
    let id: String               // String(remanga_id)
    let volume: String?          // tome
    let chapter: String?         // chapter number
    let title: String?           // name
    let pages: Int?              // count from pages array
    let publishAt: String?       // upload_date
    let scanlationGroup: String? // publishers[0].name
    let isPaid: Bool

    var displayName: String {
        var parts: [String] = []
        if let volume, !volume.isEmpty, volume != "0" {
            parts.append("Vol. \(volume)")
        }
        if let chapter, !chapter.isEmpty {
            parts.append("Ch. \(chapter)")
        }
        if let title, !title.isEmpty {
            parts.append("- \(title)")
        }
        return parts.isEmpty ? "Chapter" : parts.joined(separator: " ")
    }

    var chapterNumber: Double? {
        guard let chapter else { return nil }
        return Double(chapter)
    }
}

// MARK: - Chapter Pages (ReManga)

struct ChapterPages {
    let pageImages: [PageImage]
    let serverLink: String
    let fallbackLink: String?
    let previousChapterId: Int?
    let nextChapterId: Int?

    struct PageImage {
        let link: String
        let height: Int
        let width: Int
    }

    func pageURL(index: Int) -> URL? {
        guard index >= 0, index < pageImages.count else { return nil }
        return URL(string: pageImages[index].link)
    }

    var totalPages: Int {
        pageImages.count
    }
}

// MARK: - ReManga JSON Parsing

extension Chapter {
    /// Parse from ReManga chapter list item
    static func from(remangaData: [String: Any]) -> Chapter? {
        guard let id = remangaData["id"] as? Int else {
            return nil
        }

        let tome = remangaData["tome"] as? Int
        let chapter = remangaData["chapter"] as? String
        let name = remangaData["name"] as? String
        let isPaid = remangaData["is_paid"] as? Bool ?? false
        let uploadDate = remangaData["upload_date"] as? String

        // Publishers
        var scanlationGroup: String?
        if let publishers = remangaData["publishers"] as? [[String: Any]],
           let first = publishers.first {
            scanlationGroup = first["name"] as? String
        }

        return Chapter(
            id: String(id),
            volume: tome.map { String($0) },
            chapter: chapter,
            title: (name?.isEmpty == true) ? nil : name,
            pages: nil, // pages count is only known after fetching chapter detail
            publishAt: uploadDate,
            scanlationGroup: scanlationGroup,
            isPaid: isPaid
        )
    }

    /// Parse array from /api/v2/titles/chapters/ response: { "results": [...] }
    static func fromArray(remangaResponse: [String: Any]) -> [Chapter] {
        guard let results = remangaResponse["results"] as? [[String: Any]] else {
            return []
        }
        return results.compactMap { Chapter.from(remangaData: $0) }
    }
}

extension ChapterPages {
    /// Parse from /api/v2/titles/chapters/{id}/ response
    static func from(remangaResponse: [String: Any]) -> ChapterPages? {
        // Parse server info
        let serverObj = remangaResponse["server"] as? [String: Any]
        let serverLink = serverObj?["link"] as? String ?? ""
        let fallbackLink = serverObj?["fallback_link"] as? String

        // Parse pages — 2D array of page objects [[{id, link, height, width}, ...], ...]
        guard let pagesArray = remangaResponse["pages"] as? [Any] else {
            return nil
        }

        var pageImages: [PageImage] = []
        for group in pagesArray {
            if let pageGroup = group as? [[String: Any]] {
                for page in pageGroup {
                    if let link = page["link"] as? String,
                       let height = page["height"] as? Int,
                       let width = page["width"] as? Int {
                        pageImages.append(PageImage(link: link, height: height, width: width))
                    }
                }
            }
        }

        guard !pageImages.isEmpty else { return nil }

        // Parse prev/next chapter IDs
        var previousChapterId: Int?
        var nextChapterId: Int?
        if let prev = remangaResponse["previous"] as? [String: Any] {
            previousChapterId = prev["id"] as? Int
        }
        if let next = remangaResponse["next"] as? [String: Any] {
            nextChapterId = next["id"] as? Int
        }

        return ChapterPages(
            pageImages: pageImages,
            serverLink: serverLink,
            fallbackLink: fallbackLink,
            previousChapterId: previousChapterId,
            nextChapterId: nextChapterId
        )
    }
}
