//
//  VideoSource.swift
//  mobile
//
//  LuAnime iOS App - Video Source Model
//

import Foundation

struct EpisodeVideoSource: Codable, Hashable {
    let url: String?
    let quality: String?
    let translationId: Int?
    let translationTitle: String?

    enum CodingKeys: String, CodingKey {
        case url, quality
        case translationId = "translation_id"
        case translationTitle = "translation_title"
    }

    var videoURL: URL? {
        guard let url = url else { return nil }
        return URL(string: url)
    }

    var displayQuality: String {
        quality ?? "Auto"
    }
}

struct PlayerState: Codable {
    var currentTime: Double
    var duration: Double
    var isPlaying: Bool
    var volume: Float
    var playbackRate: Float

    init() {
        self.currentTime = 0
        self.duration = 0
        self.isPlaying = false
        self.volume = 1.0
        self.playbackRate = 1.0
    }

    var progress: Double {
        guard duration > 0 else { return 0 }
        return currentTime / duration
    }

    var formattedCurrentTime: String {
        formatTime(currentTime)
    }

    var formattedDuration: String {
        formatTime(duration)
    }

    private func formatTime(_ seconds: Double) -> String {
        let totalSeconds = Int(seconds)
        let hours = totalSeconds / 3600
        let minutes = (totalSeconds % 3600) / 60
        let secs = totalSeconds % 60

        if hours > 0 {
            return String(format: "%d:%02d:%02d", hours, minutes, secs)
        }
        return String(format: "%d:%02d", minutes, secs)
    }
}
