//
//  HomeView.swift
//  mobile
//
//  LuAnime iOS App - Home View
//

import SwiftUI

struct HomeView: View {
    @State private var discoverItems: [DiscoverItem] = []
    @State private var scheduleResponse: ScheduleResponse?
    @State private var trendingAnime: [Anime] = []
    @State private var isLoading = true
    @State private var error: String?
    @State private var selectedAnime: Anime?

    var body: some View {
        NavigationStack {
            ZStack {
                AppGradients.background
                    .ignoresSafeArea()

                ContentLoadingView(
                    isLoading: isLoading,
                    error: error,
                    retryAction: {
                        Task { await loadData() }
                    }
                ) {
                    content
                }
            }
            .navigationDestination(item: $selectedAnime) { anime in
                AnimeDetailView(anime: anime)
            }
        }
        .task {
            await loadData()
        }
    }

    private var content: some View {
        ScrollView(showsIndicators: false) {
            VStack(spacing: 32) {
                if !discoverItems.isEmpty {
                    HeroBannerView(items: discoverItems) { item in
                        handleDiscoverAction(item)
                    }
                }

                if !trendingAnime.isEmpty {
                    AnimeHorizontalList(
                        title: "Trending",
                        animes: trendingAnime
                    ) { anime in
                        selectedAnime = anime
                    }
                }

                if let schedule = scheduleResponse {
                    ScheduleSection(schedule: schedule) { anime in
                        Task {
                            await selectScheduleAnime(anime)
                        }
                    }
                }

                Spacer(minLength: 100)
            }
            .padding(.top)
        }
    }

    @MainActor
    private func loadData() async {
        isLoading = true
        error = nil

        do {
            async let discover = APIService.shared.getDiscover()
            async let schedule = APIService.shared.getSchedule()

            discoverItems = try await discover
            scheduleResponse = try await schedule

            // Show main content as soon as discover and schedule are loaded
            isLoading = false

            // Load trending anime sequentially with yield to keep UI responsive
            if let firstDay = scheduleResponse?.allDays.first(where: { !$0.isEmpty }) {
                let animeIds = firstDay.prefix(10).map { $0.id }

                var results: [Anime] = []
                for id in animeIds {
                    // Yield to allow UI updates between requests
                    await Task.yield()

                    if let anime = try? await APIService.shared.getAnime(id: id) {
                        results.append(anime)
                        // Update UI progressively after each loaded anime
                        trendingAnime = results
                    }
                }
            }
        } catch {
            self.error = error.localizedDescription
            isLoading = false
        }
    }

    private func handleDiscoverAction(_ item: DiscoverItem) {
        // Parse action to navigate to anime detail
        if let action = item.action,
           let idString = action.components(separatedBy: "/").last,
           let animeId = Int(idString) {
            Task {
                do {
                    let anime = try await APIService.shared.getAnime(id: animeId)
                    await MainActor.run {
                        selectedAnime = anime
                    }
                } catch {
                    print("Failed to load anime: \(error)")
                }
            }
        }
    }

    private func selectScheduleAnime(_ scheduleAnime: ScheduleAnime) async {
        do {
            let anime = try await APIService.shared.getAnime(id: scheduleAnime.id)
            await MainActor.run {
                selectedAnime = anime
            }
        } catch {
            print("Failed to load anime: \(error)")
        }
    }
}

#Preview {
    HomeView()
}
