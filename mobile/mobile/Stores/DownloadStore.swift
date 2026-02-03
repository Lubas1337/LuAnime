//
//  DownloadStore.swift
//  mobile
//
//  LuAnime iOS App - Download Store
//  Manages downloading, storing, and deleting anime episodes for offline playback.
//  Uses AVAssetDownloadURLSession for HLS streams (Apple's official offline HLS mechanism).
//

import Foundation
import AVFoundation

enum DownloadStatus: Equatable {
    case waiting
    case downloading
    case failed(String)
}

struct DownloadTask: Identifiable {
    let id: String
    let animeId: Int
    let episodeNumber: Int
    var progress: Double
    var status: DownloadStatus
    var anime: Anime?
    var episodeName: String?
}

@Observable
final class DownloadStore: NSObject, AVAssetDownloadDelegate {
    static let shared = DownloadStore()

    var downloadedEpisodes: [DownloadedEpisode] = []
    var activeDownloads: [String: DownloadTask] = [:]

    private let storageKey = AppConstants.Storage.downloadedEpisodesKey
    private let userDefaults = UserDefaults.standard
    private let downloadsDirectory: URL

    private var downloadAllTask: Task<Void, Never>?
    private var activeTasks: [String: Task<Void, Never>] = [:]

    /// AVAssetDownloadURLSession for HLS offline downloads
    private var hlsSession: AVAssetDownloadURLSession!

    /// Metadata for tracking HLS download tasks
    private struct HLSTaskMeta {
        let key: String
        let anime: Anime
        let episodeNumber: Int
        let episodeName: String?
        let quality: String
    }
    private var hlsTaskMeta: [Int: HLSTaskMeta] = [:]

    /// Continuations for sequential "download all" flow
    private var hlsCompletions: [String: CheckedContinuation<Bool, Never>] = [:]

    /// URLSession for direct (non-HLS) downloads
    private let directSession: URLSession

    private override init() {
        let docs = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask)[0]
        downloadsDirectory = docs.appendingPathComponent("Downloads", isDirectory: true)

        let directConfig = URLSessionConfiguration.default
        directConfig.timeoutIntervalForRequest = 60
        directConfig.timeoutIntervalForResource = 600
        directConfig.httpMaximumConnectionsPerHost = 4
        directSession = URLSession(configuration: directConfig)

        super.init()

        // HLS session (background so downloads survive app suspension)
        let hlsConfig = URLSessionConfiguration.background(withIdentifier: "com.luanime.hlsdownloads")
        hlsSession = AVAssetDownloadURLSession(
            configuration: hlsConfig,
            assetDownloadDelegate: self,
            delegateQueue: .main
        )

        try? FileManager.default.createDirectory(at: downloadsDirectory, withIntermediateDirectories: true)

        loadDownloads()
        validateFiles()
    }

    // MARK: - Query

    func isDownloaded(animeId: Int, episodeNumber: Int) -> Bool {
        downloadedEpisodes.contains { $0.animeId == animeId && $0.episodeNumber == episodeNumber }
    }

    func getLocalURL(animeId: Int, episodeNumber: Int) -> URL? {
        guard let episode = downloadedEpisodes.first(where: { $0.animeId == animeId && $0.episodeNumber == episodeNumber }),
              let localURL = episode.localURL else {
            return nil
        }
        // Works for both files and .movpkg directories
        let exists = FileManager.default.fileExists(atPath: localURL.path)
        return exists ? localURL : nil
    }

    func downloadProgress(animeId: Int, episodeNumber: Int) -> Double? {
        let key = "\(animeId)-\(episodeNumber)"
        return activeDownloads[key]?.progress
    }

    func downloadStatus(animeId: Int, episodeNumber: Int) -> DownloadStatus? {
        let key = "\(animeId)-\(episodeNumber)"
        return activeDownloads[key]?.status
    }

    var totalStorageUsed: Int64 {
        downloadedEpisodes.reduce(0) { $0 + $1.fileSize }
    }

    var totalStorageFormatted: String {
        ByteCountFormatter.string(fromByteCount: totalStorageUsed, countStyle: .file)
    }

    // MARK: - Download

    func downloadEpisode(anime: Anime, episode: Episode, kodikURL: String, quality: String) {
        let key = "\(anime.id)-\(episode.episodeNumber)"

        guard activeDownloads[key] == nil else { return }
        guard !isDownloaded(animeId: anime.id, episodeNumber: episode.episodeNumber) else { return }

        activeDownloads[key] = DownloadTask(
            id: key,
            animeId: anime.id,
            episodeNumber: episode.episodeNumber,
            progress: 0,
            status: .waiting,
            anime: anime,
            episodeName: episode.name
        )

        let task = Task {
            await performDownload(key: key, anime: anime, episode: episode, kodikURL: kodikURL, quality: quality)
        }
        activeTasks[key] = task
    }

    func downloadAllEpisodes(anime: Anime, episodes: [Episode], quality: String) {
        downloadAllTask?.cancel()

        downloadAllTask = Task {
            for episode in episodes {
                guard !Task.isCancelled else { break }

                let key = "\(anime.id)-\(episode.episodeNumber)"
                guard activeDownloads[key] == nil,
                      !isDownloaded(animeId: anime.id, episodeNumber: episode.episodeNumber),
                      let url = episode.url else {
                    continue
                }

                await MainActor.run {
                    activeDownloads[key] = DownloadTask(
                        id: key,
                        animeId: anime.id,
                        episodeNumber: episode.episodeNumber,
                        progress: 0,
                        status: .waiting,
                        anime: anime,
                        episodeName: episode.name
                    )
                }

                await performDownload(key: key, anime: anime, episode: episode, kodikURL: url, quality: quality)
            }
        }
    }

    // MARK: - Helpers

    private func kodikHost(from urlString: String) -> String? {
        let normalized = urlString.hasPrefix("//") ? "https:\(urlString)" : urlString
        guard let url = URL(string: normalized), let host = url.host else { return nil }
        return host
    }

    private func buildHeaders(refererHost: String?) -> [String: String] {
        var headers: [String: String] = [
            "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15"
        ]
        if let host = refererHost {
            headers["Referer"] = "https://\(host)/"
            headers["Origin"] = "https://\(host)"
        }
        return headers
    }

    // MARK: - Download Implementation

    private func performDownload(key: String, anime: Anime, episode: Episode, kodikURL: String, quality: String) async {
        await MainActor.run {
            activeDownloads[key]?.status = .downloading
        }

        do {
            // 1. Resolve Kodik URL to direct video/HLS URL
            let isKodik = episode.isIframe && EpisodePlayerView.isKodikURL(kodikURL)
            let videoURL: URL
            let refererHost: String?

            if isKodik {
                refererHost = kodikHost(from: kodikURL)
                let links = try await KodikParser.shared.extractVideoLinks(from: kodikURL)
                guard let link = links.first(where: { $0.quality == quality }) ?? links.first else {
                    throw KodikError.noLinksFound
                }
                videoURL = link.url
                print("📥 DownloadStore: Resolved Kodik → \(videoURL.absoluteString.prefix(80))...")
            } else {
                refererHost = nil
                guard let url = URL(string: kodikURL) else {
                    throw KodikError.invalidURL
                }
                videoURL = url
            }

            // 2. Probe content type
            let headers = buildHeaders(refererHost: refererHost)
            var probeRequest = URLRequest(url: videoURL)
            probeRequest.httpMethod = "HEAD"
            for (k, v) in headers { probeRequest.setValue(v, forHTTPHeaderField: k) }

            let (_, probeResponse) = try await URLSession.shared.data(for: probeRequest)
            let contentType = (probeResponse as? HTTPURLResponse)?.value(forHTTPHeaderField: "Content-Type") ?? ""
            let isHLS = contentType.contains("mpegurl") || contentType.contains("m3u8") || videoURL.pathExtension == "m3u8"

            if isHLS {
                // 3a. HLS → use AVAssetDownloadURLSession
                print("📥 DownloadStore: Starting HLS download via AVAssetDownloadURLSession...")
                try await downloadHLS(
                    key: key,
                    m3u8URL: videoURL,
                    refererHost: refererHost,
                    anime: anime,
                    episode: episode,
                    quality: quality
                )
            } else {
                // 3b. Direct video download
                print("📥 DownloadStore: Starting direct download...")
                try await downloadDirect(
                    key: key,
                    videoURL: videoURL,
                    headers: headers,
                    anime: anime,
                    episode: episode,
                    quality: quality
                )
            }
        } catch {
            print("📥 DownloadStore: Failed - \(error.localizedDescription)")
            if !Task.isCancelled {
                await MainActor.run {
                    activeDownloads[key]?.status = .failed(error.localizedDescription)
                    activeTasks.removeValue(forKey: key)
                }
            }
        }
    }

    // MARK: - HLS Download (AVAssetDownloadURLSession)

    private func downloadHLS(key: String, m3u8URL: URL, refererHost: String?, anime: Anime, episode: Episode, quality: String) async throws {
        var assetHeaders: [String: String] = [
            "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15"
        ]
        if let host = refererHost {
            assetHeaders["Referer"] = "https://\(host)/"
            assetHeaders["Origin"] = "https://\(host)"
        }

        let asset = AVURLAsset(url: m3u8URL, options: [
            "AVURLAssetHTTPHeaderFieldsKey" as String: assetHeaders
        ])

        guard let task = hlsSession.makeAssetDownloadTask(
            asset: asset,
            assetTitle: "\(anime.displayTitle) Ep.\(episode.episodeNumber)",
            assetArtworkData: nil,
            options: [AVAssetDownloadTaskMinimumRequiredMediaBitrateKey: 0]
        ) else {
            throw NSError(domain: "DownloadStore", code: -1,
                          userInfo: [NSLocalizedDescriptionKey: "Failed to create HLS download task"])
        }

        // Store metadata for delegate callbacks
        hlsTaskMeta[task.taskIdentifier] = HLSTaskMeta(
            key: key, anime: anime, episodeNumber: episode.episodeNumber,
            episodeName: episode.name, quality: quality
        )

        task.resume()
        print("📥 DownloadStore: HLS task started (id=\(task.taskIdentifier))")

        // Wait for completion via continuation
        let success = await withCheckedContinuation { (continuation: CheckedContinuation<Bool, Never>) in
            hlsCompletions[key] = continuation
        }

        if !success {
            throw NSError(domain: "DownloadStore", code: -2,
                          userInfo: [NSLocalizedDescriptionKey: "HLS download failed"])
        }
    }

    // MARK: - AVAssetDownloadDelegate

    func urlSession(_ session: URLSession, assetDownloadTask: AVAssetDownloadTask, didFinishDownloadingTo location: URL) {
        guard let meta = hlsTaskMeta[assetDownloadTask.taskIdentifier] else { return }

        print("📥 DownloadStore: HLS download finished → \(location.relativePath)")

        // Save relative path from home directory
        let relativePath = location.relativePath

        // Calculate directory size
        let fileSize = Self.directorySize(at: location)

        let downloaded = DownloadedEpisode(
            animeId: meta.anime.id,
            episodeNumber: meta.episodeNumber,
            episodeName: meta.episodeName,
            quality: meta.quality,
            fileSize: fileSize,
            downloadedAt: Date(),
            localFileName: relativePath,
            anime: meta.anime
        )

        downloadedEpisodes.append(downloaded)
        activeDownloads.removeValue(forKey: meta.key)
        activeTasks.removeValue(forKey: meta.key)
        saveDownloads()

        print("📥 DownloadStore: Saved episode \(meta.episodeNumber) (\(ByteCountFormatter.string(fromByteCount: fileSize, countStyle: .file)))")
    }

    func urlSession(_ session: URLSession, assetDownloadTask: AVAssetDownloadTask, didLoad timeRange: CMTimeRange, totalTimeRangesLoaded loadedRanges: [NSValue], timeRangeExpectedToLoad: CMTimeRange) {
        guard let meta = hlsTaskMeta[assetDownloadTask.taskIdentifier] else { return }

        var loaded = 0.0
        for range in loadedRanges {
            loaded += range.timeRangeValue.duration.seconds
        }
        let expected = timeRangeExpectedToLoad.duration.seconds
        let progress = expected > 0 ? min(loaded / expected, 1.0) : 0

        activeDownloads[meta.key]?.progress = progress
    }

    func urlSession(_ session: URLSession, task: URLSessionTask, didCompleteWithError error: Error?) {
        guard let assetTask = task as? AVAssetDownloadTask,
              let meta = hlsTaskMeta[assetTask.taskIdentifier] else { return }

        let key = meta.key
        hlsTaskMeta.removeValue(forKey: assetTask.taskIdentifier)

        if let error = error as? NSError {
            // Cancellation is not a failure
            if error.domain == NSURLErrorDomain && error.code == NSURLErrorCancelled {
                print("📥 DownloadStore: HLS download cancelled for ep \(meta.episodeNumber)")
                activeDownloads.removeValue(forKey: key)
            } else {
                print("📥 DownloadStore: HLS download error - \(error.localizedDescription)")
                activeDownloads[key]?.status = .failed(error.localizedDescription)
            }
            hlsCompletions.removeValue(forKey: key)?.resume(returning: false)
        } else {
            // Success — didFinishDownloadingTo was already called
            hlsCompletions.removeValue(forKey: key)?.resume(returning: true)
        }
    }

    // MARK: - Direct Download

    private func downloadDirect(key: String, videoURL: URL, headers: [String: String], anime: Anime, episode: Episode, quality: String) async throws {
        let fileName = "\(UUID().uuidString).mp4"
        let destURL = downloadsDirectory.appendingPathComponent(fileName)

        var request = URLRequest(url: videoURL)
        for (k, v) in headers { request.setValue(v, forHTTPHeaderField: k) }

        let (data, _) = try await directSession.data(for: request)
        try data.write(to: destURL)

        let attrs = try FileManager.default.attributesOfItem(atPath: destURL.path)
        let fileSize = attrs[.size] as? Int64 ?? 0

        if fileSize < 500_000 {
            try? FileManager.default.removeItem(at: destURL)
            throw NSError(domain: "DownloadStore", code: -1,
                          userInfo: [NSLocalizedDescriptionKey: "File too small (\(ByteCountFormatter.string(fromByteCount: fileSize, countStyle: .file)))"])
        }

        let downloaded = DownloadedEpisode(
            animeId: anime.id,
            episodeNumber: episode.episodeNumber,
            episodeName: episode.name,
            quality: quality,
            fileSize: fileSize,
            downloadedAt: Date(),
            localFileName: fileName,
            anime: anime
        )

        await MainActor.run {
            downloadedEpisodes.append(downloaded)
            activeDownloads.removeValue(forKey: key)
            activeTasks.removeValue(forKey: key)
            saveDownloads()
        }
    }

    // MARK: - Cancel / Delete

    func cancelDownload(animeId: Int, episodeNumber: Int) {
        let key = "\(animeId)-\(episodeNumber)"
        activeTasks[key]?.cancel()
        activeTasks.removeValue(forKey: key)

        // Cancel any HLS tasks
        for (taskId, meta) in hlsTaskMeta where meta.key == key {
            hlsSession.getAllTasks { tasks in
                tasks.first { $0.taskIdentifier == taskId }?.cancel()
            }
        }

        activeDownloads.removeValue(forKey: key)
    }

    func deleteDownload(animeId: Int, episodeNumber: Int) {
        guard let index = downloadedEpisodes.firstIndex(where: { $0.animeId == animeId && $0.episodeNumber == episodeNumber }) else {
            return
        }

        let episode = downloadedEpisodes[index]
        if let localURL = episode.localURL {
            try? FileManager.default.removeItem(at: localURL)
        }

        downloadedEpisodes.remove(at: index)
        saveDownloads()
    }

    func deleteAllForAnime(animeId: Int) {
        let toDelete = downloadedEpisodes.filter { $0.animeId == animeId }
        for episode in toDelete {
            if let localURL = episode.localURL {
                try? FileManager.default.removeItem(at: localURL)
            }
        }
        downloadedEpisodes.removeAll { $0.animeId == animeId }
        saveDownloads()
    }

    // MARK: - Persistence

    private func loadDownloads() {
        guard let data = userDefaults.data(forKey: storageKey),
              let decoded = try? JSONDecoder().decode([DownloadedEpisode].self, from: data) else {
            return
        }
        downloadedEpisodes = decoded
    }

    private func saveDownloads() {
        let toSave = downloadedEpisodes
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
        downloadedEpisodes.removeAll { episode in
            guard let localURL = episode.localURL else {
                hasOrphans = true
                return true
            }
            if !FileManager.default.fileExists(atPath: localURL.path) {
                hasOrphans = true
                return true
            }
            return false
        }
        if hasOrphans {
            saveDownloads()
        }
    }

    func episodesGroupedByAnime() -> [(anime: Anime, episodes: [DownloadedEpisode])] {
        var groups: [Int: (anime: Anime, episodes: [DownloadedEpisode])] = [:]

        for episode in downloadedEpisodes {
            let animeId = episode.animeId
            if groups[animeId] != nil {
                groups[animeId]?.episodes.append(episode)
            } else if let anime = episode.anime {
                groups[animeId] = (anime: anime, episodes: [episode])
            }
        }

        return groups.values
            .sorted { ($0.episodes.first?.downloadedAt ?? .distantPast) > ($1.episodes.first?.downloadedAt ?? .distantPast) }
    }

    // MARK: - Utilities

    /// Calculate total size of a directory (for .movpkg bundles)
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
