//
//  RegisterSheet.swift
//  mobile
//
//  LuAnime iOS App - Register Sheet
//

import SwiftUI

struct RegisterSheet: View {
    @Environment(\.dismiss) private var dismiss
    @State private var authStore = AuthStore.shared

    @State private var login = ""
    @State private var email = ""
    @State private var password = ""
    @State private var confirmPassword = ""
    @State private var showPassword = false

    @FocusState private var focusedField: Field?

    enum Field {
        case login, email, password, confirmPassword
    }

    private var isFormValid: Bool {
        !login.isEmpty &&
        email.isValidEmail &&
        password.count >= 6 &&
        password == confirmPassword
    }

    private var passwordsMatch: Bool {
        password == confirmPassword || confirmPassword.isEmpty
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

                        registerButton
                        Spacer(minLength: 100)
                    }
                    .padding(24)
                }
            }
            .navigationTitle("Create Account")
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
        .presentationDetents([.large])
        .presentationDragIndicator(.visible)
        .onChange(of: authStore.isAuthenticated) { _, isAuthenticated in
            if isAuthenticated {
                dismiss()
            }
        }
    }

    private var headerSection: some View {
        VStack(spacing: 12) {
            Image(systemName: "person.badge.plus.fill")
                .font(.system(size: 64))
                .foregroundStyle(AppColors.primary)

            Text("Join LuAnime")
                .font(.title2)
                .fontWeight(.bold)
                .foregroundStyle(.white)

            Text("Create an account to get started")
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
                focusedField = .email
            }

            VStack(alignment: .leading, spacing: 4) {
                GlassTextField(
                    icon: "envelope",
                    placeholder: "Email",
                    text: $email
                )
                .focused($focusedField, equals: .email)
                .textContentType(.emailAddress)
                .autocapitalization(.none)
                .keyboardType(.emailAddress)
                .onSubmit {
                    focusedField = .password
                }

                if !email.isEmpty && !email.isValidEmail {
                    Text("Please enter a valid email")
                        .font(.caption)
                        .foregroundStyle(AppColors.error)
                        .padding(.leading, 4)
                }
            }

            GlassTextField(
                icon: "lock",
                placeholder: "Password (min 6 characters)",
                text: $password,
                isSecure: !showPassword,
                trailingIcon: showPassword ? "eye.slash" : "eye",
                trailingAction: {
                    showPassword.toggle()
                }
            )
            .focused($focusedField, equals: .password)
            .textContentType(.newPassword)
            .onSubmit {
                focusedField = .confirmPassword
            }

            VStack(alignment: .leading, spacing: 4) {
                GlassTextField(
                    icon: "lock.fill",
                    placeholder: "Confirm Password",
                    text: $confirmPassword,
                    isSecure: !showPassword
                )
                .focused($focusedField, equals: .confirmPassword)
                .textContentType(.newPassword)
                .onSubmit {
                    performRegister()
                }

                if !passwordsMatch {
                    Text("Passwords don't match")
                        .font(.caption)
                        .foregroundStyle(AppColors.error)
                        .padding(.leading, 4)
                }
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

    private var registerButton: some View {
        GlassButton("Create Account", icon: "arrow.right", style: .primary, isLoading: authStore.isLoading) {
            performRegister()
        }
        .disabled(!isFormValid)
    }

    private func performRegister() {
        focusedField = nil
        Task {
            await authStore.register(login: login, email: email, password: password)
        }
    }
}

#Preview {
    RegisterSheet()
}
