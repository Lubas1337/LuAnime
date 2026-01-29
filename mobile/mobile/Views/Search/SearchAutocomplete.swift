//
//  SearchAutocomplete.swift
//  mobile
//
//  LuAnime iOS App - Search Autocomplete
//

import SwiftUI
import Combine

struct SearchAutocomplete: View {
    @Binding var searchText: String
    @Binding var isVisible: Bool
    var onSelect: ((Anime) -> Void)?

    @State private var suggestions: [Anime] = []
    @State private var isLoading = false
    @State private var searchTask: Task<Void, Never>?

    var body: some View {
        if isVisible && (!suggestions.isEmpty || isLoading) {
            VStack(alignment: .leading, spacing: 0) {
                if isLoading {
                    HStack {
                        ProgressView()
                            .tint(AppColors.primary)
                        Text("Searching...")
                            .font(.subheadline)
                            .foregroundStyle(AppColors.textSecondary)
                    }
                    .padding()
                } else {
                    ForEach(suggestions.prefix(5)) { anime in
                        SuggestionRow(anime: anime) {
                            onSelect?(anime)
                            isVisible = false
                        }
                    }
                }
            }
            .liquidGlass(cornerRadius: AppConstants.Layout.cornerRadius)
            .padding(.horizontal)
        }
    }

    private func performSearch() {
        searchTask?.cancel()

        guard searchText.count >= 2 else {
            suggestions = []
            return
        }

        isLoading = true

        searchTask = Task {
            try? await Task.sleep(nanoseconds: 300_000_000)

            guard !Task.isCancelled else { return }

            do {
                let results = try await APIService.shared.searchAnime(query: searchText, page: 1)
                await MainActor.run {
                    if !Task.isCancelled {
                        suggestions = results
                        isLoading = false
                    }
                }
            } catch {
                await MainActor.run {
                    if !Task.isCancelled {
                        suggestions = []
                        isLoading = false
                    }
                }
            }
        }
    }
}

struct SuggestionRow: View {
    let anime: Anime
    var onTap: (() -> Void)?

    var body: some View {
        Button {
            onTap?()
        } label: {
            HStack(spacing: 12) {
                AnimePosterImage(
                    url: anime.posterURL ?? anime.imageURL,
                    cornerRadius: 8
                )
                .frame(width: 50, height: 70)

                VStack(alignment: .leading, spacing: 4) {
                    Text(anime.displayTitle)
                        .font(.subheadline)
                        .fontWeight(.medium)
                        .foregroundStyle(.white)
                        .lineLimit(2)

                    HStack(spacing: 8) {
                        if let rating = anime.grade, rating > 0 {
                            HStack(spacing: 4) {
                                Image(systemName: "star.fill")
                                    .foregroundStyle(AppColors.rating)
                                Text(String(format: "%.1f", rating))
                            }
                            .font(.caption)
                            .foregroundStyle(AppColors.textSecondary)
                        }

                        if let year = anime.year {
                            Text(String(year))
                                .font(.caption)
                                .foregroundStyle(AppColors.textSecondary)
                        }
                    }
                }

                Spacer()

                Image(systemName: "chevron.right")
                    .font(.caption)
                    .foregroundStyle(AppColors.textTertiary)
            }
            .padding(12)
        }
        .buttonStyle(.plain)
    }
}

struct SearchFieldView: View {
    @Binding var text: String
    var placeholder: String = "Search..."
    var onSubmit: (() -> Void)?

    @FocusState private var isFocused: Bool

    var body: some View {
        HStack(spacing: 8) {
            Image(systemName: "magnifyingglass")
                .foregroundStyle(AppColors.textSecondary)

            TextField(placeholder, text: $text)
                .foregroundStyle(.white)
                .focused($isFocused)
                .onSubmit {
                    onSubmit?()
                }

            if !text.isEmpty {
                Button {
                    text = ""
                } label: {
                    Image(systemName: "xmark.circle.fill")
                        .foregroundStyle(AppColors.textTertiary)
                }
            }
        }
        .padding(12)
        .liquidGlassCapsule()
    }
}

#Preview {
    ZStack {
        AppGradients.background
            .ignoresSafeArea()

        VStack {
            SearchFieldView(text: .constant("Attack"))
                .padding()

            Spacer()
        }
    }
}
