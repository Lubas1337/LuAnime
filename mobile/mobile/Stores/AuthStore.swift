//
//  AuthStore.swift
//  mobile
//
//  LuAnime iOS App - Auth Store
//

import SwiftUI

@Observable
final class AuthStore {
    static let shared = AuthStore()

    var user: User?
    var token: String?
    var isLoading = false
    var error: String?

    var isAuthenticated: Bool {
        token != nil && user != nil
    }

    private init() {
        loadSavedSession()
    }

    private func loadSavedSession() {
        Task {
            let (savedUser, savedToken) = await AuthService.shared.getCurrentSession()
            await MainActor.run {
                self.user = savedUser
                self.token = savedToken
            }
        }
    }

    func login(login: String, password: String) async {
        await MainActor.run {
            isLoading = true
            error = nil
        }

        do {
            let (user, token) = try await AuthService.shared.login(login: login, password: password)
            await MainActor.run {
                self.user = user
                self.token = token
                self.isLoading = false
            }
        } catch {
            await MainActor.run {
                self.error = error.localizedDescription
                self.isLoading = false
            }
        }
    }

    func register(login: String, email: String, password: String) async {
        await MainActor.run {
            isLoading = true
            error = nil
        }

        do {
            let (user, token) = try await AuthService.shared.register(login: login, email: email, password: password)
            await MainActor.run {
                self.user = user
                self.token = token
                self.isLoading = false
            }
        } catch {
            await MainActor.run {
                self.error = error.localizedDescription
                self.isLoading = false
            }
        }
    }

    func logout() {
        Task {
            await AuthService.shared.logout()
            await MainActor.run {
                self.user = nil
                self.token = nil
            }
        }
    }

    func refreshProfile() async {
        guard let userId = user?.id, let token = token else { return }

        do {
            let profile = try await APIService.shared.getProfile(userId: userId, token: token)
            await MainActor.run {
                self.user = profile
            }
        } catch {
            print("Failed to refresh profile: \(error)")
        }
    }

    func clearError() {
        error = nil
    }
}
