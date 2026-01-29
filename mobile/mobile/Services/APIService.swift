//
//  APIService.swift
//  mobile
//
//  LuAnime iOS App - API Service
//

import Foundation

enum APIError: Error, LocalizedError {
    case invalidURL
    case invalidResponse
    case networkError(Error)
    case decodingError(Error)
    case serverError(Int, String?)
    case unauthorized
    case notFound

    var errorDescription: String? {
        switch self {
        case .invalidURL:
            return "Invalid URL"
        case .invalidResponse:
            return "Invalid response from server"
        case .networkError(let error):
            return "Network error: \(error.localizedDescription)"
        case .decodingError(let error):
            return "Data error: \(error.localizedDescription)"
        case .serverError(let code, let message):
            return message ?? "Server error: \(code)"
        case .unauthorized:
            return "Unauthorized. Please login again."
        case .notFound:
            return "Resource not found"
        }
    }
}

actor APIService {
    static let shared = APIService()

    private let baseURL = "https://api.anixart.tv"
    private let session: URLSession
    private let decoder: JSONDecoder

    private init() {
        let config = URLSessionConfiguration.default
        config.timeoutIntervalForRequest = 30
        config.timeoutIntervalForResource = 60
        self.session = URLSession(configuration: config)

        self.decoder = JSONDecoder()
        decoder.keyDecodingStrategy = .useDefaultKeys
    }

    private func request<T: Decodable>(
        path: String,
        method: String = "GET",
        body: [String: Any]? = nil,
        token: String? = nil
    ) async throws -> T {
        guard let url = URL(string: baseURL + path) else {
            throw APIError.invalidURL
        }

        var request = URLRequest(url: url)
        request.httpMethod = method
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.setValue("application/json", forHTTPHeaderField: "Accept")

        if let token = token {
            request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        }

        if let body = body {
            request.httpBody = try JSONSerialization.data(withJSONObject: body)
        }

        do {
            let (data, response) = try await session.data(for: request)

            guard let httpResponse = response as? HTTPURLResponse else {
                throw APIError.invalidResponse
            }

            switch httpResponse.statusCode {
            case 200...299:
                do {
                    return try decoder.decode(T.self, from: data)
                } catch {
                    print("Decoding error: \(error)")
                    print("Response: \(String(data: data, encoding: .utf8) ?? "nil")")
                    throw APIError.decodingError(error)
                }
            case 401:
                throw APIError.unauthorized
            case 404:
                throw APIError.notFound
            default:
                let message = try? JSONDecoder().decode([String: String].self, from: data)["error"]
                throw APIError.serverError(httpResponse.statusCode, message)
            }
        } catch let error as APIError {
            throw error
        } catch {
            throw APIError.networkError(error)
        }
    }

    // MARK: - Anime

    func getAnime(id: Int) async throws -> Anime {
        let response: AnimeResponse = try await request(path: "/release/\(id)")
        guard let anime = response.release else {
            throw APIError.notFound
        }
        return anime
    }

    func getRandomAnime() async throws -> Anime {
        let response: AnimeResponse = try await request(path: "/release/random")
        guard let anime = response.release else {
            throw APIError.notFound
        }
        return anime
    }

    // MARK: - Schedule

    func getSchedule() async throws -> ScheduleResponse {
        try await request(path: "/schedule")
    }

    // MARK: - Discover

    func getDiscover(page: Int = 0) async throws -> [DiscoverItem] {
        let response: DiscoverResponse = try await request(
            path: "/discover/interesting",
            method: "POST",
            body: ["page": page]
        )
        return response.content ?? []
    }

    // MARK: - Search

    func searchAnime(query: String, page: Int = 0) async throws -> [Anime] {
        let response: SearchResponse = try await request(
            path: "/search/releases/\(page)",
            method: "POST",
            body: ["query": query]
        )
        return response.content ?? []
    }

    // MARK: - Episodes & Translations

    func getVoiceovers(animeId: Int) async throws -> [Translation] {
        let response: VoiceoversResponse = try await request(path: "/episode/\(animeId)")
        return response.types ?? []
    }

    func getSources(animeId: Int, typeId: Int) async throws -> [VideoSource] {
        let response: SourcesResponse = try await request(path: "/episode/\(animeId)/\(typeId)")
        return response.sources ?? []
    }

    func getEpisodes(animeId: Int, typeId: Int, sourceId: Int) async throws -> [Episode] {
        let response: EpisodesResponse = try await request(path: "/episode/\(animeId)/\(typeId)/\(sourceId)")
        return response.episodes ?? []
    }

    // MARK: - Favorites

    func getFavorites(token: String, page: Int = 0) async throws -> [Anime] {
        let response: FavoritesResponse = try await request(path: "/favorite/\(page)", token: token)
        return response.content ?? []
    }

    func addFavorite(animeId: Int, token: String) async throws -> Bool {
        let _: GenericResponse = try await request(path: "/favorite/add/\(animeId)", token: token)
        return true
    }

    func removeFavorite(animeId: Int, token: String) async throws -> Bool {
        let _: GenericResponse = try await request(path: "/favorite/delete/\(animeId)", token: token)
        return true
    }

    // MARK: - Auth (Demo mode — matches web app behavior)

    func login(login: String, password: String) async throws -> AuthResponse {
        // Demo auth: accept password "demo" or password == login (same as web app)
        guard password == "demo" || password == login else {
            throw APIError.serverError(401, "Неверный логин или пароль")
        }

        let token = "mock_token_\(Int(Date().timeIntervalSince1970))_\(UUID().uuidString.prefix(8))"
        let userId = abs(login.hashValue % 100000)
        let user = User(
            id: userId,
            login: login,
            email: "\(login)@example.com",
            avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=\(login)",
            status: nil,
            isPremium: false,
            createdAt: nil,
            lastOnline: nil
        )

        return AuthResponse(profileToken: token, profile: user, code: 0, error: nil)
    }

    func register(login: String, email: String, password: String) async throws -> AuthResponse {
        guard !login.isEmpty, !email.isEmpty, password.count >= 6 else {
            throw APIError.serverError(400, "Все поля обязательны, пароль минимум 6 символов")
        }

        let token = "mock_token_\(Int(Date().timeIntervalSince1970))_\(UUID().uuidString.prefix(8))"
        let userId = abs(login.hashValue % 100000)
        let user = User(
            id: userId,
            login: login,
            email: email,
            avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=\(login)",
            status: nil,
            isPremium: false,
            createdAt: nil,
            lastOnline: nil
        )

        return AuthResponse(profileToken: token, profile: user, code: 0, error: nil)
    }

    func getProfile(userId: Int, token: String? = nil) async throws -> User {
        let response: ProfileResponse = try await request(path: "/profile/\(userId)", token: token)
        guard let profile = response.profile else {
            throw APIError.notFound
        }
        return profile
    }
}

// MARK: - API Response Models

struct AnimeResponse: Codable {
    let code: Int?
    let release: Anime?
}

struct DiscoverResponse: Codable {
    let code: Int?
    let content: [DiscoverItem]?
}

struct ScheduleResponse: Codable {
    let code: Int?
    let monday: [ScheduleAnime]?
    let tuesday: [ScheduleAnime]?
    let wednesday: [ScheduleAnime]?
    let thursday: [ScheduleAnime]?
    let friday: [ScheduleAnime]?
    let saturday: [ScheduleAnime]?
    let sunday: [ScheduleAnime]?

    var allDays: [[ScheduleAnime]] {
        [
            monday ?? [],
            tuesday ?? [],
            wednesday ?? [],
            thursday ?? [],
            friday ?? [],
            saturday ?? [],
            sunday ?? []
        ]
    }

    var dayNames: [String] {
        ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
    }
}

struct SearchResponse: Codable {
    let code: Int?
    let content: [Anime]?
    let totalCount: Int?
    let totalPageCount: Int?
    let currentPage: Int?

    enum CodingKeys: String, CodingKey {
        case code, content
        case totalCount = "total_count"
        case totalPageCount = "total_page_count"
        case currentPage = "current_page"
    }
}

struct VoiceoversResponse: Codable {
    let code: Int?
    let types: [Translation]?
}

struct SourcesResponse: Codable {
    let code: Int?
    let sources: [VideoSource]?
}

struct EpisodesResponse: Codable {
    let code: Int?
    let episodes: [Episode]?
}

struct FavoritesResponse: Codable {
    let code: Int?
    let content: [Anime]?
}

struct GenericResponse: Codable {
    let code: Int?
    let error: String?
}

struct ProfileResponse: Codable {
    let code: Int?
    let profile: User?
}
