//
//  KodikParser.swift
//  mobile
//
//  LuAnime iOS App - Kodik Video Parser
//  Extracts direct video URLs from Kodik iframe embeds
//

import Foundation

/// Error types for Kodik parsing
enum KodikError: Error, LocalizedError {
    case invalidURL
    case parsingFailed
    case networkError(Error)
    case noLinksFound
    case decryptionFailed
    case invalidResponse

    var errorDescription: String? {
        switch self {
        case .invalidURL:
            return "Invalid Kodik URL format"
        case .parsingFailed:
            return "Failed to parse Kodik page"
        case .networkError(let error):
            return "Network error: \(error.localizedDescription)"
        case .noLinksFound:
            return "No video links found"
        case .decryptionFailed:
            return "Failed to decrypt video URL"
        case .invalidResponse:
            return "Invalid response from Kodik"
        }
    }
}

/// Represents a video link with quality information
struct KodikVideoLink {
    let quality: String
    let url: URL
    let type: String

    /// Quality as integer for sorting (e.g., "720" -> 720)
    var qualityValue: Int {
        Int(quality.replacingOccurrences(of: "p", with: "")) ?? 0
    }
}

/// Parsed Kodik URL components
private struct ParsedKodikLink {
    let host: String
    let type: String
    let id: String
    let hash: String
    let quality: String
}

/// Response from Kodik video info endpoint
private struct KodikVideoInfoResponse: Decodable {
    let links: [String: [[String: String]]]?
}

/// Parser for extracting direct video URLs from Kodik embeds
actor KodikParser {
    static let shared = KodikParser()

    private let videoInfoEndpoint = "/ftor"

    private let session: URLSession

    /// Regex pattern for parsing Kodik URLs
    /// Matches: https://kodik.info/seria/12345/hash123/720p
    private let linkPattern = #"^(?:https?:|)//([a-z0-9]+\.[a-z]+)/([a-z]+)/(\d+)/([0-9a-z]+)/(\d+p)"#

    private init() {
        let config = URLSessionConfiguration.default
        config.timeoutIntervalForRequest = 15
        config.timeoutIntervalForResource = 30
        self.session = URLSession(configuration: config)
    }

    // MARK: - Public API

    /// Extracts direct video links from a Kodik URL
    /// - Parameter kodikURL: The Kodik iframe URL
    /// - Returns: Array of video links sorted by quality (highest first)
    func extractVideoLinks(from kodikURL: String) async throws -> [KodikVideoLink] {
        print("🎬 KodikParser: Extracting links from: \(kodikURL)")

        // 1. Parse the Kodik URL
        let parsed = try parseLink(kodikURL)
        print("🎬 KodikParser: Parsed - host: \(parsed.host), type: \(parsed.type), id: \(parsed.id)")

        // 2. Fetch encrypted links from API
        let encryptedLinks = try await fetchVideoInfo(parsed: parsed)
        print("🎬 KodikParser: Got \(encryptedLinks.count) quality options")

        // 3. Decrypt and convert to VideoLink objects
        let links = decryptLinks(encryptedLinks)

        guard !links.isEmpty else {
            throw KodikError.noLinksFound
        }

        print("🎬 KodikParser: Successfully extracted \(links.count) video links")
        return links.sorted { $0.qualityValue > $1.qualityValue }
    }

    /// Gets the best quality video URL
    /// - Parameter kodikURL: The Kodik iframe URL
    /// - Returns: The highest quality video URL
    func getBestQualityURL(from kodikURL: String) async throws -> URL {
        let links = try await extractVideoLinks(from: kodikURL)
        guard let best = links.first else {
            throw KodikError.noLinksFound
        }
        return best.url
    }

    // MARK: - Private Methods

    /// Parses a Kodik URL into its components
    private func parseLink(_ link: String) throws -> ParsedKodikLink {
        guard let regex = try? NSRegularExpression(pattern: linkPattern, options: []) else {
            throw KodikError.parsingFailed
        }

        let range = NSRange(link.startIndex..<link.endIndex, in: link)
        guard let match = regex.firstMatch(in: link, options: [], range: range) else {
            // Try alternative URL format: /serial/xxx or /video/xxx
            return try parseAlternativeLink(link)
        }

        guard
            let hostRange = Range(match.range(at: 1), in: link),
            let typeRange = Range(match.range(at: 2), in: link),
            let idRange = Range(match.range(at: 3), in: link),
            let hashRange = Range(match.range(at: 4), in: link),
            let qualityRange = Range(match.range(at: 5), in: link)
        else {
            throw KodikError.invalidURL
        }

        return ParsedKodikLink(
            host: String(link[hostRange]),
            type: String(link[typeRange]),
            id: String(link[idRange]),
            hash: String(link[hashRange]),
            quality: String(link[qualityRange])
        )
    }

    /// Parses alternative Kodik URL formats
    private func parseAlternativeLink(_ link: String) throws -> ParsedKodikLink {
        guard let url = URL(string: link.hasPrefix("//") ? "https:\(link)" : link) else {
            throw KodikError.invalidURL
        }

        guard let host = url.host else {
            throw KodikError.invalidURL
        }

        let pathComponents = url.pathComponents.filter { $0 != "/" }

        guard pathComponents.count >= 3 else {
            throw KodikError.invalidURL
        }

        // Format: /type/id/hash or /type/id/hash/quality
        let type = pathComponents[0]
        let id = pathComponents[1]
        let hash = pathComponents[2]
        let quality = pathComponents.count > 3 ? pathComponents[3] : "720p"

        return ParsedKodikLink(
            host: host,
            type: type,
            id: id,
            hash: hash,
            quality: quality
        )
    }

    /// Fetches encrypted video info from Kodik API
    private func fetchVideoInfo(parsed: ParsedKodikLink) async throws -> [String: [[String: String]]] {
        var components = URLComponents()
        components.scheme = "https"
        components.host = parsed.host
        components.path = videoInfoEndpoint
        components.queryItems = [
            URLQueryItem(name: "type", value: parsed.type),
            URLQueryItem(name: "id", value: parsed.id),
            URLQueryItem(name: "hash", value: parsed.hash)
        ]

        guard let url = components.url else {
            throw KodikError.invalidURL
        }

        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("https://\(parsed.host)", forHTTPHeaderField: "Referer")
        request.setValue("https://\(parsed.host)", forHTTPHeaderField: "Origin")
        request.setValue("application/x-www-form-urlencoded", forHTTPHeaderField: "Content-Type")
        request.setValue("Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15", forHTTPHeaderField: "User-Agent")

        // Try to get additional parameters from the page first
        let params = try await fetchUrlParams(from: parsed)
        if !params.isEmpty {
            request.httpBody = params.data(using: .utf8)
        }

        do {
            let (data, response) = try await session.data(for: request)

            guard let httpResponse = response as? HTTPURLResponse else {
                throw KodikError.invalidResponse
            }

            print("🎬 KodikParser: API response status: \(httpResponse.statusCode)")

            if let responseString = String(data: data, encoding: .utf8) {
                print("🎬 KodikParser: Response preview: \(String(responseString.prefix(200)))")
            }

            let videoInfo = try JSONDecoder().decode(KodikVideoInfoResponse.self, from: data)

            guard let links = videoInfo.links, !links.isEmpty else {
                throw KodikError.noLinksFound
            }

            return links
        } catch let error as KodikError {
            throw error
        } catch {
            throw KodikError.networkError(error)
        }
    }

    /// Fetches urlParams from the Kodik player page
    private func fetchUrlParams(from parsed: ParsedKodikLink) async throws -> String {
        var components = URLComponents()
        components.scheme = "https"
        components.host = parsed.host
        components.path = "/\(parsed.type)/\(parsed.id)/\(parsed.hash)/\(parsed.quality)"

        guard let url = components.url else {
            return ""
        }

        var request = URLRequest(url: url)
        request.setValue("Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15", forHTTPHeaderField: "User-Agent")

        do {
            let (data, _) = try await session.data(for: request)

            guard let html = String(data: data, encoding: .utf8) else {
                return ""
            }

            // Extract urlParams from JavaScript
            // Looking for: var urlParams = '{"d":"...", "d_sign":"...", ...}';
            let pattern = #"var\s+urlParams\s*=\s*'(\{[^']+\})'"#
            guard let regex = try? NSRegularExpression(pattern: pattern, options: []) else {
                return ""
            }

            let range = NSRange(html.startIndex..<html.endIndex, in: html)
            guard let match = regex.firstMatch(in: html, options: [], range: range),
                  let paramsRange = Range(match.range(at: 1), in: html) else {
                return ""
            }

            let jsonString = String(html[paramsRange])
            print("🎬 KodikParser: Found urlParams: \(String(jsonString.prefix(100)))...")

            // Convert JSON to URL-encoded form
            guard let jsonData = jsonString.data(using: .utf8),
                  let params = try? JSONSerialization.jsonObject(with: jsonData) as? [String: Any] else {
                return ""
            }

            let formParams = params.map { key, value -> String in
                let valueStr = "\(value)"
                let encoded = valueStr.addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed) ?? valueStr
                return "\(key)=\(encoded)"
            }.joined(separator: "&")

            return formParams
        } catch {
            print("🎬 KodikParser: Failed to fetch urlParams: \(error)")
            return ""
        }
    }

    /// Decrypts links using ROT18 + Base64
    private func decryptLinks(_ links: [String: [[String: String]]]) -> [KodikVideoLink] {
        var result: [KodikVideoLink] = []

        for (quality, sources) in links {
            for source in sources {
                guard let encryptedSrc = source["src"],
                      let type = source["type"] else {
                    continue
                }

                if let decryptedURL = decryptSource(encryptedSrc) {
                    // Ensure URL has protocol
                    var urlString = decryptedURL
                    if urlString.hasPrefix("//") {
                        urlString = "https:" + urlString
                    }

                    if let url = URL(string: urlString) {
                        result.append(KodikVideoLink(
                            quality: quality,
                            url: url,
                            type: type
                        ))
                        print("🎬 KodikParser: Decrypted \(quality): \(String(urlString.prefix(60)))...")
                    }
                }
            }
        }

        return result
    }

    /// Decrypts a single source URL: ROT18 decode -> Base64 decode
    private func decryptSource(_ encrypted: String) -> String? {
        // Step 1: Apply ROT18 (Caesar cipher with shift of 18)
        let rot18Decoded = decodeROT18(encrypted)

        // Step 2: Base64 decode
        // Handle URL-safe base64
        var base64 = rot18Decoded
            .replacingOccurrences(of: "-", with: "+")
            .replacingOccurrences(of: "_", with: "/")

        // Add padding if needed
        let paddingLength = (4 - base64.count % 4) % 4
        base64 += String(repeating: "=", count: paddingLength)

        guard let data = Data(base64Encoded: base64) else {
            print("🎬 KodikParser: Base64 decode failed for: \(String(rot18Decoded.prefix(30)))...")
            return nil
        }

        return String(data: data, encoding: .utf8)
    }

    /// Decodes ROT18 (Caesar cipher with shift of 18)
    /// This matches the JavaScript implementation from kodikwrapper
    private func decodeROT18(_ input: String) -> String {
        return String(input.map { char in
            guard char.isLetter, let scalar = char.unicodeScalars.first else {
                return char
            }

            let charCode = scalar.value

            // JavaScript logic:
            // (charCode <= 90 ? 90 : 122) >= (charCode = charCode + 18) ? charCode : charCode - 26
            let upperBound: UInt32 = charCode <= 90 ? 90 : 122 // Z for uppercase, z for lowercase
            var newCode = charCode + 18

            if newCode > upperBound {
                newCode -= 26
            }

            guard let newScalar = UnicodeScalar(newCode) else {
                return char
            }

            return Character(newScalar)
        })
    }
}
