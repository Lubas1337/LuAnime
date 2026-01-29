//
//  MangaReadingProgress.swift
//  mobile
//
//  LuAnime iOS App - Manga Reading Progress Model
//

import Foundation

struct MangaReadingProgress: Identifiable, Codable, Hashable {
    var id: String { "\(mangaId)-\(chapterId)" }
    let mangaId: String
    let chapterId: String
    let chapterNumber: String?
    var currentPage: Int
    var totalPages: Int
    var updatedAt: Date
    var manga: Manga?

    var progress: Double {
        guard totalPages > 0 else { return 0 }
        return Double(currentPage + 1) / Double(totalPages)
    }

    var isCompleted: Bool {
        guard totalPages > 0 else { return false }
        return currentPage >= totalPages - 1
    }
}

struct MangaFavoriteItem: Identifiable, Codable, Hashable {
    var id: String { mangaId }
    let mangaId: String
    let addedAt: Date
    var manga: Manga?
}
