//
//  MangaDownloadStore.swift
//  mobile
//
//  LuAnime iOS App - Manga Download Store
//  Manages downloading, storing, and deleting manga chapters for offline reading.
//

import Foundation
import UIKit

enum MangaDownloadStatus: Equatable {
    case waiting
    case downloading
    case failed(String)
}

struct MangaDownloadTask: Identifiable {
    let id: String
    let mangaId: String
    let chapterId: String
    var progress: Double
    var status: MangaDownloadStatus
    var manga: Manga?
    var chapterDisplayName: String
}

@Observable
final class MangaDownloadStore {
    static let shared = MangaDownloadStore()

    var downloadedChapters: [DownloadedChapter] = []
    var activeDownloads: [String: MangaDownloadTask] = [:]

    private let storageKey = AppConstants.Storage.downloadedMangaChaptersKey
    private let userDefaults = UserDefaults.standard
    private let mangaDownloadsDirectory: URL

    private var downloadAllTask: Task<Void, Never>?
    private var activeTasks: [String: Task<Void, Never>] = [:]

    /// URLSession matching MangaImageLoader headers for downloading page images
    private let imageSession: URLSession = {
        let config = URLSessionConfiguration.default
        config.httpAdditionalHeaders = [
            "User-Agent": "ReComics/1.4.1 CFNetwork/3826.400.120 Darwin/24.3.0",
            "referer": "https://remanga.org/"
        ]
        config.timeoutIntervalForRequest = 30
        config.httpMaximumConnectionsPerHost = 3
        return URLSession(configuration: config)
    }()

    private init() {
        let docs = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask)[0]
        mangaDownloadsDirectory = docs.appendingPathComponent("MangaDownloads", isDirectory: true)
        try? FileManager.default.createDirectory(at: mangaDownloadsDirectory, withIntermediateDirectories: true)

        loadDownloads()
        validateFiles()
    }

    // MARK: - Query

    func isDownloaded(mangaId: String, chapterId: String) -> Bool {
        downloadedChapters.contains { $0.mangaId == mangaId && $0.chapterId == chapterId }
    }

    func getDownloadedChapter(mangaId: String, chapterId: String) -> DownloadedChapter? {
        downloadedChapters.first { $0.mangaId == mangaId && $0.chapterId == chapterId }
    }

    var totalStorageUsed: Int64 {
        downloadedChapters.reduce(0) { $0 + $1.fileSize }
    }

    var totalStorageFormatted: String {
        ByteCountFormatter.string(fromByteCount: totalStorageUsed, countStyle: .file)
    }

    func chaptersGroupedByManga() -> [(manga: Manga, chapters: [DownloadedChapter])] {
        var groups: [String: (manga: Manga, chapters: [DownloadedChapter])] = [:]

        for chapter in downloadedChapters {
            let mangaId = chapter.mangaId
            if groups[mangaId] != nil {
                groups[mangaId]?.chapters.append(chapter)
            } else if let manga = chapter.manga {
                groups[mangaId] = (manga: manga, chapters: [chapter])
            }
        }

        return groups.values
            .sorted { ($0.chapters.first?.downloadedAt ?? .distantPast) > ($1.chapters.first?.downloadedAt ?? .distantPast) }
    }

    // MARK: - Download Single Chapter

    func downloadChapter(manga: Manga, chapter: Chapter) {
        let key = "\(manga.id)-\(chapter.id)"

        guard activeDownloads[key] == nil else { return }
        guard !isDownloaded(mangaId: manga.id, chapterId: chapter.id) else { return }

        activeDownloads[key] = MangaDownloadTask(
            id: key,
            mangaId: manga.id,
            chapterId: chapter.id,
            progress: 0,
            status: .waiting,
            manga: manga,
            chapterDisplayName: chapter.displayName
        )

        let task = Task {
            await performDownload(key: key, manga: manga, chapter: chapter)
        }
        activeTasks[key] = task
    }

    // MARK: - Download All Chapters

    func downloadAllChapters(manga: Manga, chapters: [Chapter]) {
        downloadAllTask?.cancel()

        downloadAllTask = Task {
            for chapter in chapters {
                guard !Task.isCancelled else { break }

                let key = "\(manga.id)-\(chapter.id)"
                guard activeDownloads[key] == nil,
                      !isDownloaded(mangaId: manga.id, chapterId: chapter.id) else {
                    continue
                }

                await MainActor.run {
                    activeDownloads[key] = MangaDownloadTask(
                        id: key,
                        mangaId: manga.id,
                        chapterId: chapter.id,
                        progress: 0,
                        status: .waiting,
                        manga: manga,
                        chapterDisplayName: chapter.displayName
                    )
                }

                await performDownload(key: key, manga: manga, chapter: chapter)
            }
        }
    }

    // MARK: - Download Implementation

    private func performDownload(key: String, manga: Manga, chapter: Chapter) async {
        await MainActor.run {
            activeDownloads[key]?.status = .downloading
        }

        do {
            // 1. Fetch chapter pages from API
            let chapterPages = try await ReMangaService.shared.getChapterPages(chapterId: chapter.id)
            let pageImages = chapterPages.pageImages
            guard !pageImages.isEmpty else {
                throw NSError(domain: "MangaDownloadStore", code: -1,
                              userInfo: [NSLocalizedDescriptionKey: "No pages found"])
            }

            // 2. Create folder
            let folderName = UUID().uuidString
            let folderURL = mangaDownloadsDirectory.appendingPathComponent(folderName, isDirectory: true)
            try FileManager.default.createDirectory(at: folderURL, withIntermediateDirectories: true)

            // 3. Download all page images concurrently (max 3 via httpMaximumConnectionsPerHost)
            let totalPages = pageImages.count
            let completedPages = CompletedCounter()

            try await withThrowingTaskGroup(of: Void.self) { group in
                for (index, pageImage) in pageImages.enumerated() {
                    group.addTask { [imageSession] in
                        let destURL = folderURL.appendingPathComponent("page_\(index).jpg")
                        try await Self.downloadPageImage(
                            urlString: pageImage.link,
                            to: destURL,
                            session: imageSession
                        )
                        let completed = await completedPages.increment()
                        await MainActor.run {
                            self.activeDownloads[key]?.progress = Double(completed) / Double(totalPages)
                        }
                    }
                }
                try await group.waitForAll()
            }

            // 4. Calculate total file size
            let fileSize = Self.directorySize(at: folderURL)

            // 5. Save metadata
            let downloaded = DownloadedChapter(
                mangaId: manga.id,
                chapterId: chapter.id,
                chapterNumber: chapter.chapter,
                chapterTitle: chapter.title,
                volume: chapter.volume,
                pageCount: totalPages,
                fileSize: fileSize,
                downloadedAt: Date(),
                folderName: folderName,
                manga: manga
            )

            await MainActor.run {
                downloadedChapters.append(downloaded)
                activeDownloads.removeValue(forKey: key)
                activeTasks.removeValue(forKey: key)
                saveDownloads()
            }

        } catch {
            if !Task.isCancelled {
                await MainActor.run {
                    activeDownloads[key]?.status = .failed(error.localizedDescription)
                    activeTasks.removeValue(forKey: key)
                }
            }
        }
    }

    /// Download a single page image with CDN fallback
    private static func downloadPageImage(urlString: String, to destURL: URL, session: URLSession) async throws {
        // Try original URL
        if let data = try? await fetchImageData(urlString: urlString, session: session),
           UIImage(data: data) != nil {
            try data.write(to: destURL)
            return
        }

        // Try fallback: swap img.reimg.org → img.reimg2.org
        let fallbackURL = urlString
            .replacingOccurrences(of: "://img.reimg.org/", with: "://img.reimg2.org/")
        if fallbackURL != urlString,
           let data = try? await fetchImageData(urlString: fallbackURL, session: session),
           UIImage(data: data) != nil {
            try data.write(to: destURL)
            return
        }

        // Try other direction: swap img.reimg2.org → img.reimg.org
        let primaryURL = urlString
            .replacingOccurrences(of: "://img.reimg2.org/", with: "://img.reimg.org/")
        if primaryURL != urlString && primaryURL != fallbackURL,
           let data = try? await fetchImageData(urlString: primaryURL, session: session),
           UIImage(data: data) != nil {
            try data.write(to: destURL)
            return
        }

        throw NSError(domain: "MangaDownloadStore", code: -2,
                      userInfo: [NSLocalizedDescriptionKey: "Failed to download page image"])
    }

    private static func fetchImageData(urlString: String, session: URLSession) async throws -> Data? {
        guard let url = URL(string: urlString) else { return nil }
        let (data, response) = try await session.data(from: url)
        guard let httpResponse = response as? HTTPURLResponse,
              httpResponse.statusCode == 200 else {
            return nil
        }
        return data
    }

    // MARK: - Cancel / Delete

    func cancelDownload(mangaId: String, chapterId: String) {
        let key = "\(mangaId)-\(chapterId)"
        activeTasks[key]?.cancel()
        activeTasks.removeValue(forKey: key)
        activeDownloads.removeValue(forKey: key)
    }

    func deleteDownload(mangaId: String, chapterId: String) {
        guard let index = downloadedChapters.firstIndex(where: { $0.mangaId == mangaId && $0.chapterId == chapterId }) else {
            return
        }

        let chapter = downloadedChapters[index]
        if let folderURL = chapter.folderURL {
            try? FileManager.default.removeItem(at: folderURL)
        }

        downloadedChapters.remove(at: index)
        saveDownloads()
    }

    func deleteAllForManga(mangaId: String) {
        let toDelete = downloadedChapters.filter { $0.mangaId == mangaId }
        for chapter in toDelete {
            if let folderURL = chapter.folderURL {
                try? FileManager.default.removeItem(at: folderURL)
            }
        }
        downloadedChapters.removeAll { $0.mangaId == mangaId }
        saveDownloads()
    }

    // MARK: - Persistence

    private func loadDownloads() {
        guard let data = userDefaults.data(forKey: storageKey),
              let decoded = try? JSONDecoder().decode([DownloadedChapter].self, from: data) else {
            return
        }
        downloadedChapters = decoded
    }

    private func saveDownloads() {
        let toSave = downloadedChapters
        let key = storageKey

        Task.detached(priority: .utility) {
            guard let encoded = try? JSONEncoder().encode(toSave) else { return }
            await MainActor.run {
                UserDefaults.standard.set(encoded, forKey: key)
            }
        }
    }

    private func validateFiles() {
        var hasOrphans = false
        downloadedChapters.removeAll { chapter in
            guard let folderURL = chapter.folderURL else {
                hasOrphans = true
                return true
            }
            if !FileManager.default.fileExists(atPath: folderURL.path) {
                hasOrphans = true
                return true
            }
            return false
        }
        if hasOrphans {
            saveDownloads()
        }
    }

    // MARK: - Utilities

    private static func directorySize(at url: URL) -> Int64 {
        let fm = FileManager.default
        guard let enumerator = fm.enumerator(at: url, includingPropertiesForKeys: [.fileSizeKey], options: [.skipsHiddenFiles]) else {
            return 0
        }
        var total: Int64 = 0
        for case let fileURL as URL in enumerator {
            if let size = try? fileURL.resourceValues(forKeys: [.fileSizeKey]).fileSize {
                total += Int64(size)
            }
        }
        return total
    }
}

// MARK: - Thread-safe counter for concurrent downloads

private actor CompletedCounter {
    private var count = 0

    func increment() -> Int {
        count += 1
        return count
    }
}
