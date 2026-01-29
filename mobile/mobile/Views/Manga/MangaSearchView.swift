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
    @State private var isSearching = false
    @State private var hasSearched = false
    @State private var error: String?
    @State private var selectedManga: Manga?
    @State private var recentSearches: [String] = []
    @State private var isSearchActive = false
    @State private var searchTask: Task<Void, Never>?

    @FocusState private var isSearchFocused: Bool

    private let recentSearchesKey = "manga_recent_searches"

    var body: some View {
        NavigationStack {
            ZStack {
                AppGradients.background
                    .ignoresSafeArea()

                VStack(spacing: 0) {
                    phoneStyleHeader
                        .padding(.horizontal)
                        .padding(.top, 8)
                        .padding(.bottom, 12)

                    contentView
                }
            }
            .navigationDestination(item: $selectedManga) { manga in
                MangaDetailView(manga: manga)
            }
            .onAppear {
                loadRecentSearches()
            }
            .onChange(of: searchText) { _, newValue in
                debouncedSearch(newValue)
            }
        }
    }

    // MARK: - Phone App Style Header

    private var phoneStyleHeader: some View {
        ZStack {
            if !isSearchActive {
                HStack {
                    Text("Search Manga")
                        .font(.largeTitle)
                        .fontWeight(.bold)
                        .foregroundStyle(.white)

                    Spacer()

                    Button {
                        withAnimation(.spring(response: 0.3, dampingFraction: 0.8)) {
                            isSearchActive = true
                        }
                        DispatchQueue.main.asyncAfter(deadline: .now() + 0.1) {
                            isSearchFocused = true
                        }
                    } label: {
                        Image(systemName: "magnifyingglass")
                            .font(.system(size: 20, weight: .medium))
                            .foregroundStyle(.white)
                            .frame(width: 44, height: 44)
                            .contentShape(Rectangle())
                    }
                }
                .transition(.opacity)
            }

            if isSearchActive {
                HStack(spacing: 12) {
                    HStack(spacing: 10) {
                        Image(systemName: "magnifyingglass")
                            .font(.system(size: 17, weight: .medium))
                            .foregroundStyle(AppColors.textSecondary)

                        TextField("Search manga...", text: $searchText)
                            .font(.body)
                            .foregroundStyle(.white)
                            .focused($isSearchFocused)
                            .onSubmit(search)
                            .autocorrectionDisabled()
                            .textInputAutocapitalization(.never)

                        if !searchText.isEmpty {
                            Button {
                                searchTask?.cancel()
                                searchText = ""
                                searchResults = []
                                hasSearched = false
                            } label: {
                                Image(systemName: "xmark.circle.fill")
                                    .font(.system(size: 17))
                                    .foregroundStyle(AppColors.textTertiary)
                            }
                        }
                    }
                    .padding(.horizontal, 12)
                    .padding(.vertical, 10)
                    .iOS26SearchFieldStyle()

                    Button {
                        searchTask?.cancel()
                        withAnimation(.spring(response: 0.3, dampingFraction: 0.8)) {
                            isSearchActive = false
                            isSearchFocused = false
                            searchText = ""
                            searchResults = []
                            hasSearched = false
                            error = nil
                        }
                    } label: {
                        Text("Cancel")
                            .font(.body)
                            .foregroundStyle(AppColors.primary)
                    }
                }
                .transition(.asymmetric(
                    insertion: .move(edge: .trailing).combined(with: .opacity),
                    removal: .opacity
                ))
            }
        }
        .frame(height: 44)
        .animation(.spring(response: 0.3, dampingFraction: 0.8), value: isSearchActive)
    }

    @ViewBuilder
    private var contentView: some View {
        if isSearchActive && searchText.isEmpty {
            recentSearchesView
        } else if isSearching {
            LoadingView(message: "Searching...")
        } else if let error {
            ErrorView(message: error) {
                search()
            }
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

                    Text("Tap search to find manga")
                        .font(.subheadline)
                        .foregroundStyle(AppColors.textSecondary)
                }
                .frame(maxWidth: .infinity)
                .padding(.top, 100)
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
                    .padding(.top, 60)
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
            await performSearch(query: trimmed, dismissKeyboard: false)
        }
    }

    private func search() {
        searchTask?.cancel()
        let trimmed = searchText.trimmed
        guard !trimmed.isEmpty else { return }

        Task {
            await performSearch(query: trimmed, dismissKeyboard: true)
            saveToRecentSearches(trimmed)
        }
    }

    private func performSearch(query: String, dismissKeyboard: Bool) async {
        await MainActor.run {
            isSearching = true
            error = nil
        }

        if dismissKeyboard {
            await MainActor.run {
                UIApplication.shared.sendAction(#selector(UIResponder.resignFirstResponder), to: nil, from: nil, for: nil)
            }
        }

        do {
            let results = try await ReMangaService.shared.searchManga(query: query)
            guard !Task.isCancelled else { return }
            await MainActor.run {
                searchResults = results
                hasSearched = true
                isSearching = false
            }
        } catch {
            guard !Task.isCancelled else { return }
            await MainActor.run {
                self.error = error.localizedDescription
                isSearching = false
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
