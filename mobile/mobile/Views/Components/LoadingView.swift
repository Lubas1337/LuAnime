//
//  LoadingView.swift
//  mobile
//
//  LuAnime iOS App - Loading View Components
//

import SwiftUI

struct LoadingView: View {
    var message: String?

    var body: some View {
        VStack(spacing: 16) {
            ProgressView()
                .scaleEffect(1.5)
                .tint(AppColors.primary)

            if let message = message {
                Text(message)
                    .font(.subheadline)
                    .foregroundStyle(AppColors.textSecondary)
            }
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .background(AppColors.background)
    }
}

struct LoadingOverlay: View {
    var isLoading: Bool
    var message: String?

    var body: some View {
        if isLoading {
            ZStack {
                Color.black.opacity(0.5)
                    .ignoresSafeArea()

                VStack(spacing: 16) {
                    ProgressView()
                        .scaleEffect(1.5)
                        .tint(.white)

                    if let message = message {
                        Text(message)
                            .font(.subheadline)
                            .foregroundStyle(.white)
                    }
                }
                .padding(32)
                .background(.ultraThinMaterial)
                .clipShape(RoundedRectangle(cornerRadius: 16))
            }
        }
    }
}

struct ErrorView: View {
    let message: String
    var retryAction: (() -> Void)?

    var body: some View {
        VStack(spacing: 20) {
            Image(systemName: "exclamationmark.triangle.fill")
                .font(.system(size: 48))
                .foregroundStyle(AppColors.error)

            Text("Something went wrong")
                .font(.headline)
                .foregroundStyle(.white)

            Text(message)
                .font(.subheadline)
                .foregroundStyle(AppColors.textSecondary)
                .multilineTextAlignment(.center)

            if let retryAction = retryAction {
                GlassButton("Try Again", icon: "arrow.clockwise", style: .primary) {
                    retryAction()
                }
            }
        }
        .padding()
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .background(AppColors.background)
    }
}

struct EmptyStateView: View {
    let icon: String
    let title: String
    let message: String
    var actionTitle: String?
    var action: (() -> Void)?

    var body: some View {
        VStack(spacing: 20) {
            Image(systemName: icon)
                .font(.system(size: 64))
                .foregroundStyle(AppColors.textTertiary)

            Text(title)
                .font(.title2)
                .fontWeight(.semibold)
                .foregroundStyle(.white)

            Text(message)
                .font(.subheadline)
                .foregroundStyle(AppColors.textSecondary)
                .multilineTextAlignment(.center)

            if let actionTitle = actionTitle, let action = action {
                GlassButton(actionTitle, style: .primary) {
                    action()
                }
                .padding(.top, 8)
            }
        }
        .padding()
        .frame(maxWidth: .infinity, maxHeight: .infinity)
    }
}

struct ContentLoadingView<Content: View>: View {
    let isLoading: Bool
    let error: String?
    let retryAction: (() -> Void)?
    @ViewBuilder let content: () -> Content

    var body: some View {
        Group {
            if isLoading {
                LoadingView()
            } else if let error = error {
                ErrorView(message: error, retryAction: retryAction)
            } else {
                content()
            }
        }
    }
}

#Preview {
    ZStack {
        AppGradients.background
            .ignoresSafeArea()

        VStack(spacing: 40) {
            ErrorView(message: "Network connection failed") {
                print("Retry tapped")
            }
            .frame(height: 250)

            EmptyStateView(
                icon: "heart.slash",
                title: "No Favorites",
                message: "Add anime to your favorites to see them here",
                actionTitle: "Browse Anime"
            ) {
                print("Browse tapped")
            }
            .frame(height: 250)
        }
    }
}
