//
//  DownloadedEpisode.swift
//  mobile
//
//  LuAnime iOS App - Downloaded Episode Model
//

import Foundation

struct DownloadedEpisode: Identifiable, Codable, Hashable {
    var id: String { "\(animeId)-\(episodeNumber)" }
    let animeId: Int
    let episodeNumber: Int
    let episodeName: String?
    let quality: String
    let fileSize: Int64
    let downloadedAt: Date
    let localFileName: String
    var anime: Anime?

    var localURL: URL? {
        if localFileName.contains("/") {
            // HLS download — relative path from home directory (.movpkg)
            let home = URL(fileURLWithPath: NSHomeDirectory())
            return home.appendingPathComponent(localFileName)
        } else {
            // Direct download — in Documents/Downloads/
            let dir = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask)[0]
                .appendingPathComponent("Downloads", isDirectory: true)
            return dir.appendingPathComponent(localFileName)
        }
    }

    var fileSizeFormatted: String {
        ByteCountFormatter.string(fromByteCount: fileSize, countStyle: .file)
    }

    enum CodingKeys: String, CodingKey {
        case animeId = "anime_id"
        case episodeNumber = "episode_number"
        case episodeName = "episode_name"
        case quality
        case fileSize = "file_size"
        case downloadedAt = "downloaded_at"
        case localFileName = "local_file_name"
        case anime
    }
}
