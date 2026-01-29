//
//  LoginSheet.swift
//  mobile
//
//  LuAnime iOS App - Login Sheet
//

import SwiftUI

struct LoginSheet: View {
    @Environment(\.dismiss) private var dismiss
    @State private var authStore = AuthStore.shared

    @State private var login = ""
    @State private var password = ""
    @State private var showPassword = false

    @FocusState private var focusedField: Field?

    enum Field {
        case login, password
    }

    var body: some View {
        NavigationStack {
            ZStack {
                AppGradients.background
                    .ignoresSafeArea()

                ScrollView {
                    VStack(spacing: 32) {
                        headerSection

                        formSection

                        if let error = authStore.error {
                            errorMessage(error)
                        }

                        loginButton

                        Spacer(minLength: 100)
                    }
                    .padding(24)
                }
            }
            .navigationTitle("Sign In")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarLeading) {
                    Button("Cancel") {
                        dismiss()
                    }
                    .foregroundStyle(AppColors.textSecondary)
                }
            }
        }
        .presentationDetents([.medium, .large])
        .presentationDragIndicator(.visible)
        .onChange(of: authStore.isAuthenticated) { _, isAuthenticated in
            if isAuthenticated {
                dismiss()
            }
        }
    }

    private var headerSection: some View {
        VStack(spacing: 12) {
            Image(systemName: "person.crop.circle.fill")
                .font(.system(size: 64))
                .foregroundStyle(AppColors.primary)

            Text("Welcome Back")
                .font(.title2)
                .fontWeight(.bold)
                .foregroundStyle(.white)

            Text("Sign in to continue")
                .font(.subheadline)
                .foregroundStyle(AppColors.textSecondary)
        }
        .padding(.top, 24)
    }

    private var formSection: some View {
        VStack(spacing: 16) {
            GlassTextField(
                icon: "person",
                placeholder: "Username",
                text: $login
            )
            .focused($focusedField, equals: .login)
            .textContentType(.username)
            .autocapitalization(.none)
            .onSubmit {
                focusedField = .password
            }

            GlassTextField(
                icon: "lock",
                placeholder: "Password",
                text: $password,
                isSecure: !showPassword,
                trailingIcon: showPassword ? "eye.slash" : "eye",
                trailingAction: {
                    showPassword.toggle()
                }
            )
            .focused($focusedField, equals: .password)
            .textContentType(.password)
            .onSubmit {
                performLogin()
            }
        }
    }

    private func errorMessage(_ message: String) -> some View {
        HStack {
            Image(systemName: "exclamationmark.triangle.fill")
                .foregroundStyle(AppColors.error)

            Text(message)
                .font(.subheadline)
                .foregroundStyle(AppColors.error)
        }
        .padding()
        .frame(maxWidth: .infinity)
        .background(AppColors.error.opacity(0.1))
        .clipShape(RoundedRectangle(cornerRadius: 12))
    }

    private var loginButton: some View {
        GlassButton("Sign In", icon: "arrow.right", style: .primary, isLoading: authStore.isLoading) {
            performLogin()
        }
        .disabled(login.isEmpty || password.isEmpty)
    }

    private func performLogin() {
        focusedField = nil
        Task {
            await authStore.login(login: login, password: password)
        }
    }
}

// MARK: - Glass Text Field

struct GlassTextField: View {
    let icon: String
    let placeholder: String
    @Binding var text: String
    var isSecure: Bool = false
    var trailingIcon: String?
    var trailingAction: (() -> Void)?

    var body: some View {
        HStack(spacing: 12) {
            Image(systemName: icon)
                .foregroundStyle(AppColors.textSecondary)
                .frame(width: 24)

            if isSecure {
                SecureField(placeholder, text: $text)
                    .foregroundStyle(.white)
            } else {
                TextField(placeholder, text: $text)
                    .foregroundStyle(.white)
            }

            if let trailingIcon = trailingIcon {
                Button {
                    trailingAction?()
                } label: {
                    Image(systemName: trailingIcon)
                        .foregroundStyle(AppColors.textSecondary)
                }
            }
        }
        .padding(16)
        .liquidGlass(cornerRadius: AppConstants.Layout.cornerRadius)
    }
}

#Preview {
    LoginSheet()
}
