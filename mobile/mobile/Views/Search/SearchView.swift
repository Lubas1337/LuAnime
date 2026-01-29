//
//  SearchView.swift
//  mobile
//
//  LuAnime iOS App - Search View (iOS 26 Phone App Style - 1:1)
//

import SwiftUI

struct SearchView: View {
    @State private var searchText = ""
    @State private var searchResults: [Anime] = []
    @State private var isSearching = false
    @State private var hasSearched = false
    @State private var error: String?
    @State private var selectedAnime: Anime?
    @State private var recentSearches: [String] = []
    @State private var isSearchActive = false
    @State private var searchTask: Task<Void, Never>?

    @FocusState private var isSearchFocused: Bool

    private let recentSearchesKey = "recent_searches"

    var body: some View {
        NavigationStack {
            ZStack {
                AppGradients.background
                    .ignoresSafeArea()

                VStack(spacing: 0) {
                    // iOS 26 Phone App Style Header
                    phoneStyleHeader
                        .padding(.horizontal)
                        .padding(.top, 8)
                        .padding(.bottom, 12)

                    // Content
                    contentView
                }
            }
            .navigationDestination(item: $selectedAnime) { anime in
                AnimeDetailView(anime: anime)
            }
            .onAppear {
                loadRecentSearches()
            }
            .onChange(of: searchText) { _, newValue in
                debouncedSearch(newValue)
            }
        }
    }

    // MARK: - Phone App Style Header (Title + Search Icon → Expands to Search Bar)

    private var phoneStyleHeader: some View {
        ZStack {
            // Collapsed State: Title on left, Search icon on right
            if !isSearchActive {
                HStack {
                    Text("Search")
                        .font(.largeTitle)
                        .fontWeight(.bold)
                        .foregroundStyle(.white)

                    Spacer()

                    // Search Icon Button
                    Button {
                        withAnimation(.spring(response: 0.3, dampingFraction: 0.8)) {
                            isSearchActive = true
                        }
                        // Delay focus to allow animation to start
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

            // Expanded State: Full-width Search Bar
            if isSearchActive {
                HStack(spacing: 12) {
                    // Search Field - Full Width
                    HStack(spacing: 10) {
                        Image(systemName: "magnifyingglass")
                            .font(.system(size: 17, weight: .medium))
                            .foregroundStyle(AppColors.textSecondary)

                        TextField("Search", text: $searchText)
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

                    // Cancel Button
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
        } else if let error = error {
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
                // Suggestions or trending could go here
                VStack(spacing: 16) {
                    Image(systemName: "sparkle.magnifyingglass")
                        .font(.system(size: 64, weight: .thin))
                        .foregroundStyle(AppColors.primary.opacity(0.5))

                    Text("Tap search to find anime")
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
                    // No recent searches
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
            AnimeGrid(
                animes: searchResults,
                columns: 2
            ) { anime in
                selectedAnime = anime
            }
            .padding(.vertical)
        }
    }

    private var emptyResults: some View {
        EmptyStateView(
            icon: "magnifyingglass",
            title: "No Results",
            message: "No anime found for \"\(searchText)\"",
            actionTitle: "Clear Search"
        ) {
            searchText = ""
        }
    }

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
            try? await Task.sleep(nanoseconds: 300_000_000) // 300ms debounce
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
            await saveToRecentSearchesAsync(trimmed)
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
            let results = try await APIService.shared.searchAnime(query: query)
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

    private func saveToRecentSearchesAsync(_ query: String) async {
        await MainActor.run {
            var searches = recentSearches
            searches.removeAll { $0 == query }
            searches.insert(query, at: 0)
            if searches.count > 10 {
                searches = Array(searches.prefix(10))
            }
            recentSearches = searches
            UserDefaults.standard.set(searches, forKey: recentSearchesKey)
        }
    }

    private func clearRecentSearches() {
        recentSearches = []
        UserDefaults.standard.removeObject(forKey: recentSearchesKey)
    }
}

// MARK: - iOS 26 Search Field Style

extension View {
    @ViewBuilder
    func iOS26SearchFieldStyle() -> some View {
        if #available(iOS 26.0, *) {
            self
                .glassEffect(.regular, in: .capsule)
        } else {
            self
                .background(.ultraThinMaterial)
                .clipShape(Capsule())
                .overlay {
                    Capsule()
                        .strokeBorder(Color.white.opacity(0.1), lineWidth: 0.5)
                }
        }
    }
}

// MARK: - Recent Search Row

struct RecentSearchRow: View {
    let query: String
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            HStack(spacing: 12) {
                Image(systemName: "magnifyingglass")
                    .font(.system(size: 16))
                    .foregroundStyle(AppColors.textTertiary)
                    .frame(width: 20)

                Text(query)
                    .font(.body)
                    .foregroundStyle(.white)
                    .lineLimit(1)

                Spacer()

                Image(systemName: "arrow.up.backward")
                    .font(.system(size: 14, weight: .medium))
                    .foregroundStyle(AppColors.textTertiary)
            }
            .padding(.horizontal, 16)
            .padding(.vertical, 12)
            .contentShape(Rectangle())
        }
        .buttonStyle(.plain)
    }
}

#Preview {
    SearchView()
}
