//
//  AppModeStore.swift
//  mobile
//
//  LuAnime iOS App - App Mode Store (Anime/Manga)
//

import SwiftUI

@Observable
final class AppModeStore {
    static let shared = AppModeStore()

    enum AppMode: String, CaseIterable, Identifiable {
        case anime
        case manga

        var id: String { rawValue }

        var displayName: String {
            switch self {
            case .anime: return "Anime"
            case .manga: return "Manga"
            }
        }

        var icon: String {
            switch self {
            case .anime: return "play.rectangle.fill"
            case .manga: return "book.fill"
            }
        }
    }

    var currentMode: AppMode {
        didSet {
            UserDefaults.standard.set(currentMode.rawValue, forKey: AppConstants.Storage.appModeKey)
        }
    }

    private init() {
        if let saved = UserDefaults.standard.string(forKey: AppConstants.Storage.appModeKey),
           let mode = AppMode(rawValue: saved) {
            currentMode = mode
        } else {
            currentMode = .anime
        }
    }

    func switchMode(_ mode: AppMode) {
        withAnimation(.smoothSpring) {
            currentMode = mode
        }
    }
}
