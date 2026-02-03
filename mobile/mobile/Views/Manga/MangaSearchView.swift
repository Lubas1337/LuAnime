//
//  MangaSearchView.swift
//  mobile
//
//  LuAnime iOS App - Manga Search View
//

import SwiftUI

struct MangaSearchView: View {
    @State private var searchText = ""
    @State private var searchResults: [Manga] = []
    @State private var isLoadingResults = false
    @State private var hasSearched = false
    @State private var error: String?
    @State private var selectedManga: Manga?
    @State private var recentSearches: [String] = []
    @State private var isSearchFieldActive = false
    @State private var searchTask: Task<Void, Never>?

    private let recentSearchesKey = "manga_recent_searches"

    var body: some View {
        NavigationStack {
            SearchableContainer(isSearchFieldActive: $isSearchFieldActive) {
                contentView
            }
            .navigationTitle("Search")
            .searchable(
                text: $searchText,
                placement: .navigationBarDrawer(displayMode: .always),
                prompt: "Search manga..."
            )
            .onSubmit(of: .search) {
                search()
            }
            .navigationDestination(item: $selectedManga) { manga in
                MangaDetailView(manga: manga)
            }
        }
        .onAppear { loadRecentSearches() }
        .onChange(of: searchText) { _, newValue in
            debouncedSearch(newValue)
        }
    }

    @ViewBuilder
    private var contentView: some View {
        if isSearchFieldActive && searchText.isEmpty {
            recentSearchesView
        } else if isLoadingResults {
            LoadingView(message: "Searching...")
        } else if let error {
            ErrorView(message: error) { search() }
        } else if !searchResults.isEmpty {
            resultsView
        } else if hasSearched && searchResults.isEmpty {
            emptyResults
        } else {
            defaultView
        }
    }

    private var defaultView: some View {
        ScrollView {
            VStack(spacing: 24) {
                VStack(spacing: 16) {
                    Image(systemName: "book.pages.fill")
                        .font(.system(size: 64, weight: .thin))
                        .foregroundStyle(AppColors.primary.opacity(0.5))

                    Text("Search for manga")
                        .font(.subheadline)
                        .foregroundStyle(AppColors.textSecondary)
                }
                .frame(maxWidth: .infinity)
                .padding(.top, 40)
            }
        }
    }

    private var recentSearchesView: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 16) {
                if !recentSearches.isEmpty {
                    HStack {
                        Text("Recent")
                            .font(.headline)
                            .foregroundStyle(AppColors.textSecondary)

                        Spacer()

                        Button("Clear") {
                            clearRecentSearches()
                        }
                        .font(.subheadline)
                        .foregroundStyle(AppColors.primary)
                    }
                    .padding(.horizontal)

                    LazyVStack(spacing: 0) {
                        ForEach(recentSearches, id: \.self) { query in
                            RecentSearchRow(query: query) {
                                searchText = query
                                search()
                            }

                            if query != recentSearches.last {
                                Divider()
                                    .background(Color.white.opacity(0.1))
                                    .padding(.leading, 44)
                            }
                        }
                    }
                    .liquidGlass(cornerRadius: 12)
                    .padding(.horizontal)
                } else {
                    VStack(spacing: 12) {
                        Image(systemName: "clock")
                            .font(.system(size: 32))
                            .foregroundStyle(AppColors.textTertiary)

                        Text("No Recent Searches")
                            .font(.subheadline)
                            .foregroundStyle(AppColors.textSecondary)
                    }
                    .frame(maxWidth: .infinity)
                    .padding(.top, 24)
                }
            }
            .padding(.top, 8)
        }
    }

    private var resultsView: some View {
        ScrollView {
            MangaGrid(
                mangas: searchResults,
                columns: 2
            ) { manga in
                selectedManga = manga
            }
            .padding(.vertical)
        }
    }

    private var emptyResults: some View {
        EmptyStateView(
            icon: "magnifyingglass",
            title: "No Results",
            message: "No manga found for \"\(searchText)\"",
            actionTitle: "Clear Search"
        ) {
            searchText = ""
        }
    }

    // MARK: - Search Logic

    private func debouncedSearch(_ query: String) {
        searchTask?.cancel()

        let trimmed = query.trimmed
        guard trimmed.count >= 2 else {
            searchResults = []
            hasSearched = false
            error = nil
            return
        }

        searchTask = Task {
            try? await Task.sleep(nanoseconds: 300_000_000)
            guard !Task.isCancelled else { return }
            await performSearch(query: trimmed)
        }
    }

    private func search() {
        searchTask?.cancel()
        let trimmed = searchText.trimmed
        guard !trimmed.isEmpty else { return }

        Task {
            await performSearch(query: trimmed)
            saveToRecentSearches(trimmed)
        }
    }

    private func performSearch(query: String) async {
        await MainActor.run {
            isLoadingResults = true
            error = nil
        }

        do {
            let results = try await ReMangaService.shared.searchManga(query: query)
            guard !Task.isCancelled else { return }
            await MainActor.run {
                searchResults = results
                hasSearched = true
                isLoadingResults = false
            }
        } catch {
            guard !Task.isCancelled else { return }
            await MainActor.run {
                self.error = error.localizedDescription
                isLoadingResults = false
            }
        }
    }

    private func loadRecentSearches() {
        recentSearches = UserDefaults.standard.stringArray(forKey: recentSearchesKey) ?? []
    }

    private func saveToRecentSearches(_ query: String) {
        var searches = recentSearches
        searches.removeAll { $0 == query }
        searches.insert(query, at: 0)
        if searches.count > 10 {
            searches = Array(searches.prefix(10))
        }
        recentSearches = searches
        UserDefaults.standard.set(searches, forKey: recentSearchesKey)
    }

    private func clearRecentSearches() {
        recentSearches = []
        UserDefaults.standard.removeObject(forKey: recentSearchesKey)
    }
}

#Preview {
    MangaSearchView()
}
