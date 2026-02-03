//
//  DownloadedChapter.swift
//  mobile
//
//  LuAnime iOS App - Downloaded Manga Chapter Model
//

import Foundation

struct DownloadedChapter: Identifiable, Codable, Hashable {
    var id: String { "\(mangaId)-\(chapterId)" }
    let mangaId: String
    let chapterId: String
    let chapterNumber: String?
    let chapterTitle: String?
    let volume: String?
    let pageCount: Int
    let fileSize: Int64
    let downloadedAt: Date
    let folderName: String
    var manga: Manga?

    var folderURL: URL? {
        let dir = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask)[0]
            .appendingPathComponent("MangaDownloads", isDirectory: true)
            .appendingPathComponent(folderName, isDirectory: true)
        return dir
    }

    func pageURL(index: Int) -> URL? {
        folderURL?.appendingPathComponent("page_\(index).jpg")
    }

    var displayName: String {
        var parts: [String] = []
        if let volume, !volume.isEmpty, volume != "0" { parts.append("Vol. \(volume)") }
        if let chapterNumber, !chapterNumber.isEmpty { parts.append("Ch. \(chapterNumber)") }
        if let chapterTitle, !chapterTitle.isEmpty { parts.append("- \(chapterTitle)") }
        return parts.isEmpty ? "Chapter" : parts.joined(separator: " ")
    }

    var fileSizeFormatted: String {
        ByteCountFormatter.string(fromByteCount: fileSize, countStyle: .file)
    }
}
