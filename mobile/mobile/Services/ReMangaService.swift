//
//  ReMangaService.swift
//  mobile
//
//  LuAnime iOS App - ReManga API Service
//

import Foundation

enum ReMangaError: LocalizedError {
    case invalidURL
    case invalidResponse
    case httpError(Int)
    case decodingError
    case noData
    case contentLicensed

    var errorDescription: String? {
        switch self {
        case .invalidURL: return "Invalid URL"
        case .invalidResponse: return "Invalid server response"
        case .httpError(let code): return "Server error (\(code))"
        case .decodingError: return "Failed to parse response"
        case .noData: return "No data received"
        case .contentLicensed: return "This content is licensed and unavailable"
        }
    }
}

actor ReMangaService {
    static let shared = ReMangaService()
    private let baseURL = "https://api.remanga.org/api/v2"
    private let session: URLSession

    private init() {
        let config = URLSessionConfiguration.default
        config.timeoutIntervalForRequest = 30
        config.httpAdditionalHeaders = [
            "User-Agent": "LuAnime/1.0",
            "Accept": "application/json"
        ]
        session = URLSession(configuration: config)
    }

    // MARK: - Search

    func searchManga(query: String, count: Int = 20) async throws -> [Manga] {
        guard let encodedQuery = query.addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed) else {
            throw ReMangaError.invalidURL
        }
        let urlString = "\(baseURL)/search/?query=\(encodedQuery)&count=\(count)"
        let json = try await fetchJSON(urlString: urlString)
        return Manga.fromSearchResponse(json)
    }

    // MARK: - Popular

    func getPopularManga(page: Int = 1, count: Int = 20) async throws -> [Manga] {
        let urlString = "\(baseURL)/titles/?ordering=-rating&count=\(count)&page=\(page)"
        let json = try await fetchJSON(urlString: urlString)
        return Manga.fromTitlesResponse(json)
    }

    // MARK: - Recently Updated

    func getRecentlyUpdated(page: Int = 1, count: Int = 20) async throws -> [Manga] {
        let urlString = "\(baseURL)/titles/?ordering=-chapter_date&count=\(count)&page=\(page)"
        let json = try await fetchJSON(urlString: urlString)
        return Manga.fromTitlesResponse(json)
    }

    // MARK: - Get Single Manga (detail with branches, genres, description)

    func getManga(dir: String) async throws -> Manga {
        let urlString = "\(baseURL)/titles/\(dir)/"
        let json = try await fetchJSON(urlString: urlString)

        guard let manga = Manga.from(remangaData: json) else {
            throw ReMangaError.decodingError
        }

        return manga
    }

    // MARK: - Chapters

    func getChapters(branchId: Int, page: Int = 1, count: Int = 100) async throws -> [Chapter] {
        let urlString = "\(baseURL)/titles/chapters/?branch_id=\(branchId)&ordering=index&count=\(count)&page=\(page)"
        let json = try await fetchJSON(urlString: urlString)
        return Chapter.fromArray(remangaResponse: json)
    }

    // MARK: - Chapter Pages

    func getChapterPages(chapterId: String) async throws -> ChapterPages {
        let urlString = "\(baseURL)/titles/chapters/\(chapterId)/"
        let json = try await fetchJSON(urlString: urlString)

        guard let pages = ChapterPages.from(remangaResponse: json) else {
            throw ReMangaError.decodingError
        }

        return pages
    }

    // MARK: - Helpers

    private func fetchJSON(urlString: String) async throws -> [String: Any] {
        guard let url = URL(string: urlString) else {
            throw ReMangaError.invalidURL
        }

        let (data, response) = try await session.data(from: url)
        try validateResponse(response)

        guard let json = try JSONSerialization.jsonObject(with: data) as? [String: Any] else {
            throw ReMangaError.decodingError
        }

        return json
    }

    private func validateResponse(_ response: URLResponse) throws {
        guard let httpResponse = response as? HTTPURLResponse else {
            throw ReMangaError.invalidResponse
        }
        guard (200...299).contains(httpResponse.statusCode) else {
            throw ReMangaError.httpError(httpResponse.statusCode)
        }
    }
}
