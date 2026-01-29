//
//  AuthService.swift
//  mobile
//
//  LuAnime iOS App - Auth Service
//

import Foundation
import Security

actor AuthService {
    static let shared = AuthService()

    private let tokenKey = AppConstants.Storage.authTokenKey
    private let userKey = AppConstants.Storage.userKey
    private let userDefaults = UserDefaults.standard

    private init() {}

    // MARK: - Token Management

    func saveToken(_ token: String) {
        let data = token.data(using: .utf8)!

        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrAccount as String: tokenKey,
            kSecValueData as String: data
        ]

        SecItemDelete(query as CFDictionary)
        SecItemAdd(query as CFDictionary, nil)
    }

    func getToken() -> String? {
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrAccount as String: tokenKey,
            kSecReturnData as String: true,
            kSecMatchLimit as String: kSecMatchLimitOne
        ]

        var result: AnyObject?
        let status = SecItemCopyMatching(query as CFDictionary, &result)

        guard status == errSecSuccess,
              let data = result as? Data,
              let token = String(data: data, encoding: .utf8) else {
            return nil
        }

        return token
    }

    func deleteToken() {
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrAccount as String: tokenKey
        ]

        SecItemDelete(query as CFDictionary)
    }

    // MARK: - User Management

    func saveUser(_ user: User) {
        if let encoded = try? JSONEncoder().encode(user) {
            userDefaults.set(encoded, forKey: userKey)
        }
    }

    func getUser() -> User? {
        guard let data = userDefaults.data(forKey: userKey),
              let user = try? JSONDecoder().decode(User.self, from: data) else {
            return nil
        }
        return user
    }

    func deleteUser() {
        userDefaults.removeObject(forKey: userKey)
    }

    // MARK: - Auth Operations

    func login(login: String, password: String) async throws -> (User, String) {
        let response = try await APIService.shared.login(login: login, password: password)

        guard response.isSuccess,
              let token = response.profileToken,
              let user = response.profile else {
            throw APIError.serverError(response.code ?? -1, response.error ?? "Login failed")
        }

        saveToken(token)
        saveUser(user)

        return (user, token)
    }

    func register(login: String, email: String, password: String) async throws -> (User, String) {
        let response = try await APIService.shared.register(login: login, email: email, password: password)

        guard response.isSuccess,
              let token = response.profileToken,
              let user = response.profile else {
            throw APIError.serverError(response.code ?? -1, response.error ?? "Registration failed")
        }

        saveToken(token)
        saveUser(user)

        return (user, token)
    }

    func logout() {
        deleteToken()
        deleteUser()
    }

    func isLoggedIn() -> Bool {
        getToken() != nil
    }

    func getCurrentSession() -> (User?, String?) {
        (getUser(), getToken())
    }
}
