//
//  MangaReaderView.swift
//  mobile
//
//  LuAnime iOS App - Manga Reader View
//

import SwiftUI

// MARK: - Chapter Segment (one loaded chapter in the reader)

private struct ChapterSegment: Identifiable {
    let id: String
    let chapter: Chapter
    let pages: ChapterPages
}

struct MangaReaderView: View {
    let manga: Manga
    let chapter: Chapter
    let allChapters: [Chapter]

    @State private var segments: [ChapterSegment] = []
    @State private var isLoading = true
    @State private var isLoadingNext = false
    @State private var error: String?
    @State private var currentPage = 0
    @State private var currentChapterId: String = ""
    @State private var showControls = true

    @Environment(\.dismiss) private var dismiss

    private let mangaStore = MangaStore.shared

    var body: some View {
        NavigationStack {
            ZStack {
                Color.black
                    .ignoresSafeArea()

                if isLoading {
                    VStack(spacing: 16) {
                        ProgressView()
                            .tint(.white)
                            .scaleEffect(1.5)
                        Text("Loading pages...")
                            .font(.caption)
                            .foregroundStyle(.white.opacity(0.5))
                    }
                } else if let error {
                    VStack(spacing: 16) {
                        Image(systemName: "exclamationmark.triangle.fill")
                            .font(.system(size: 40))
                            .foregroundStyle(AppColors.warning)
                        Text(error)
                            .font(.subheadline)
                            .foregroundStyle(.white.opacity(0.7))
                            .multilineTextAlignment(.center)
                            .padding(.horizontal, 32)
                        Button("Retry") {
                            Task { await loadInitialChapter() }
                        }
                        .font(.subheadline)
                        .fontWeight(.medium)
                        .foregroundStyle(.white)
                        .padding(.horizontal, 24)
                        .padding(.vertical, 10)
                        .background(AppColors.primary)
                        .clipShape(Capsule())
                    }
                } else {
                    readerContent
                }
            }
            .toolbar {
                ToolbarItem(placement: .topBarLeading) {
                    Button {
                        saveAllProgress()
                        dismiss()
                    } label: {
                        Image(systemName: "xmark.circle.fill")
                            .font(.title2)
                            .symbolRenderingMode(.palette)
                            .foregroundStyle(.white, .white.opacity(0.3))
                    }
                }
            }
            .toolbarBackground(.hidden, for: .navigationBar)
        }
        .task {
            currentChapterId = chapter.id
            if let progress = mangaStore.getProgress(mangaId: manga.id, chapterId: chapter.id) {
                currentPage = progress.currentPage
            }
            await loadInitialChapter()
        }
        .onDisappear {
            saveAllProgress()
        }
    }

    // MARK: - Reader Content

    private var readerContent: some View {
        ZStack {
            ScrollViewReader { proxy in
                ScrollView(.vertical, showsIndicators: false) {
                    LazyVStack(spacing: AppConstants.Layout.readerPageSpacing) {
                        ForEach(segments) { segment in
                            // Chapter divider between chapters
                            if segment.id != segments.first?.id {
                                chapterDivider(segment.chapter)
                            }

                            // Pages
                            ForEach(0..<segment.pages.totalPages, id: \.self) { index in
                                pageView(segment: segment, index: index)
                                    .id("\(segment.id)-\(index)")
                            }
                        }

                        // Loading next chapter indicator
                        if isLoadingNext {
                            VStack(spacing: 12) {
                                ProgressView()
                                    .tint(.white)
                                Text("Loading next chapter...")
                                    .font(.caption)
                                    .foregroundStyle(.white.opacity(0.5))
                            }
                            .frame(maxWidth: .infinity)
                            .padding(40)
                        }

                        // End — no more chapters
                        if !isLoadingNext && !hasNextChapter(after: segments.last?.chapter) {
                            readerEndView
                        }
                    }
                }
                .onAppear {
                    if currentPage > 0 {
                        proxy.scrollTo("\(chapter.id)-\(currentPage)", anchor: .top)
                    }
                }
            }
            .onTapGesture {
                withAnimation(.easeInOut(duration: 0.2)) {
                    showControls.toggle()
                }
            }

            if showControls {
                controlsOverlay
            }
        }
    }

    private func pageView(segment: ChapterSegment, index: Int) -> some View {
        let pageImage = segment.pages.pageImages[index]
        let rawAspectRatio = CGFloat(pageImage.width) / CGFloat(max(pageImage.height, 1))
        let aspectRatio = rawAspectRatio > 0 ? rawAspectRatio : 0.7

        return MangaPageView(
            urlString: pageImage.link,
            aspectRatio: aspectRatio,
            pageNumber: index + 1
        )
        .onAppear {
            currentChapterId = segment.chapter.id
            currentPage = index

            // Save progress periodically
            if index % 3 == 0 {
                saveProgress(for: segment, page: index)
            }

            // Preload next chapter when near the end
            if index >= segment.pages.totalPages - 3 {
                loadNextChapterIfNeeded(after: segment.chapter)
            }
        }
    }

    // MARK: - Chapter Divider

    private func chapterDivider(_ chapter: Chapter) -> some View {
        VStack(spacing: 0) {
            Rectangle()
                .fill(Color.black)
                .frame(height: 16)

            HStack(spacing: 8) {
                Rectangle()
                    .fill(AppColors.primary)
                    .frame(height: 1)
                Text(chapter.displayName)
                    .font(.caption)
                    .fontWeight(.bold)
                    .foregroundStyle(.white)
                    .padding(.horizontal, 12)
                    .padding(.vertical, 6)
                    .background(AppColors.primary)
                    .clipShape(Capsule())
                Rectangle()
                    .fill(AppColors.primary)
                    .frame(height: 1)
            }
            .padding(.horizontal, 20)
            .padding(.vertical, 12)
            .frame(maxWidth: .infinity)
            .background(Color.black)

            Rectangle()
                .fill(Color.black)
                .frame(height: 16)
        }
    }

    // MARK: - End View

    private var readerEndView: some View {
        VStack(spacing: 20) {
            Image(systemName: "checkmark.circle.fill")
                .font(.system(size: 48))
                .foregroundStyle(AppColors.success)

            if let lastSegment = segments.last {
                Text("End of \(lastSegment.chapter.displayName)")
                    .font(.headline)
                    .foregroundStyle(.white)
            }

            Text("No more chapters")
                .font(.subheadline)
                .foregroundStyle(.white.opacity(0.5))

            Button {
                saveAllProgress()
                dismiss()
            } label: {
                Text("Back to Details")
                    .font(.subheadline)
                    .fontWeight(.medium)
                    .foregroundStyle(.white)
                    .padding(.horizontal, 24)
                    .padding(.vertical, 12)
                    .background(AppColors.primary)
                    .clipShape(Capsule())
            }
        }
        .padding(40)
        .frame(maxWidth: .infinity)
    }

    // MARK: - Controls Overlay

    private var controlsOverlay: some View {
        VStack {
            HStack {
                Color.clear.frame(width: 36, height: 36)
                Spacer()

                VStack(spacing: 2) {
                    Text(currentChapterDisplayName)
                        .font(.subheadline)
                        .fontWeight(.semibold)
                        .foregroundStyle(.white)

                    Text(manga.displayTitle)
                        .font(.caption2)
                        .foregroundStyle(.white.opacity(0.7))
                }

                Spacer()
                Color.clear.frame(width: 36, height: 36)
            }
            .padding(.horizontal)
            .padding(.top, 8)
            .padding(.bottom, 12)
            .background {
                LinearGradient(
                    colors: [.black.opacity(0.7), .clear],
                    startPoint: .top,
                    endPoint: .bottom
                )
                .ignoresSafeArea()
            }

            Spacer()

            // Bottom bar with current page info
            if let currentSegment = segments.first(where: { $0.id == currentChapterId }) {
                Text("\(currentChapterDisplayName) — \(currentPage + 1) / \(currentSegment.pages.totalPages)")
                    .font(.caption)
                    .fontWeight(.medium)
                    .foregroundStyle(.white)
                    .padding(.horizontal, 16)
                    .padding(.vertical, 8)
                    .background(.black.opacity(0.6))
                    .clipShape(Capsule())
                    .padding(.bottom, 16)
            }
        }
        .transition(.opacity)
    }

    private var currentChapterDisplayName: String {
        segments.first(where: { $0.id == currentChapterId })?.chapter.displayName ?? chapter.displayName
    }

    // MARK: - Chapter Navigation Helpers

    private func chapterIndex(for ch: Chapter) -> Int? {
        allChapters.firstIndex(where: { $0.id == ch.id })
    }

    private func hasNextChapter(after ch: Chapter?) -> Bool {
        guard let ch, let idx = chapterIndex(for: ch) else { return false }
        return idx < allChapters.count - 1
    }

    private func nextChapter(after ch: Chapter) -> Chapter? {
        guard let idx = chapterIndex(for: ch), idx < allChapters.count - 1 else { return nil }
        return allChapters[idx + 1]
    }

    // MARK: - Data Loading

    @MainActor
    private func loadInitialChapter() async {
        isLoading = true
        error = nil

        // Check for offline download first
        if let downloaded = MangaDownloadStore.shared.getDownloadedChapter(mangaId: manga.id, chapterId: chapter.id) {
            let localPages = (0..<downloaded.pageCount).map { i in
                ChapterPages.PageImage(
                    link: downloaded.pageURL(index: i)!.absoluteString,
                    height: 0, width: 0
                )
            }
            let chapterPages = ChapterPages(
                pageImages: localPages,
                serverLink: "",
                fallbackLink: nil,
                previousChapterId: nil,
                nextChapterId: nil
            )
            segments = [ChapterSegment(id: chapter.id, chapter: chapter, pages: chapterPages)]
            isLoading = false
            return
        }

        do {
            let pages = try await ReMangaService.shared.getChapterPages(chapterId: chapter.id)
            segments = [ChapterSegment(id: chapter.id, chapter: chapter, pages: pages)]
            isLoading = false
        } catch {
            self.error = error.localizedDescription
            isLoading = false
        }
    }

    private func loadNextChapterIfNeeded(after ch: Chapter) {
        guard !isLoadingNext else { return }
        guard let next = nextChapter(after: ch) else { return }
        // Don't reload already loaded chapters
        guard !segments.contains(where: { $0.id == next.id }) else { return }
        guard !next.isPaid else { return }

        isLoadingNext = true

        // Check for offline download first
        if let downloaded = MangaDownloadStore.shared.getDownloadedChapter(mangaId: manga.id, chapterId: next.id) {
            let localPages = (0..<downloaded.pageCount).map { i in
                ChapterPages.PageImage(
                    link: downloaded.pageURL(index: i)!.absoluteString,
                    height: 0, width: 0
                )
            }
            let chapterPages = ChapterPages(
                pageImages: localPages,
                serverLink: "",
                fallbackLink: nil,
                previousChapterId: nil,
                nextChapterId: nil
            )
            segments.append(ChapterSegment(id: next.id, chapter: next, pages: chapterPages))
            isLoadingNext = false
            return
        }

        Task {
            do {
                let pages = try await ReMangaService.shared.getChapterPages(chapterId: next.id)
                await MainActor.run {
                    segments.append(ChapterSegment(id: next.id, chapter: next, pages: pages))
                    isLoadingNext = false
                }
            } catch {
                await MainActor.run { isLoadingNext = false }
            }
        }
    }

    // MARK: - Progress

    private func saveProgress(for segment: ChapterSegment, page: Int) {
        mangaStore.updateProgress(
            mangaId: manga.id,
            chapterId: segment.chapter.id,
            chapterNumber: segment.chapter.chapter,
            page: page,
            totalPages: segment.pages.totalPages,
            manga: manga
        )
    }

    private func saveAllProgress() {
        if let segment = segments.first(where: { $0.id == currentChapterId }) {
            saveProgress(for: segment, page: currentPage)
        }
    }
}

// MARK: - Manga Image Session (matches ReManga reference app headers)

private enum MangaImageLoader {
    static let session: URLSession = {
        let config = URLSessionConfiguration.default
        config.httpAdditionalHeaders = [
            "User-Agent": "ReComics/1.4.1 CFNetwork/3826.400.120 Darwin/24.3.0",
            "referer": "https://remanga.org/"
        ]
        config.timeoutIntervalForRequest = 30
        return URLSession(configuration: config)
    }()

    static func loadImage(urlString: String) async -> UIImage? {
        // Fast path for local file:// URLs (offline pages)
        if urlString.hasPrefix("file://"), let url = URL(string: urlString),
           let data = try? Data(contentsOf: url), let image = UIImage(data: data) {
            return image
        }

        // Try original URL first
        if let image = await fetchImage(urlString: urlString) {
            return image
        }

        // Try fallback: swap img.reimg.org → img.reimg2.org
        let fallbackURL = urlString
            .replacingOccurrences(of: "://img.reimg.org/", with: "://img.reimg2.org/")
        if fallbackURL != urlString, let image = await fetchImage(urlString: fallbackURL) {
            return image
        }

        // Try other direction: swap img.reimg2.org → img.reimg.org
        let primaryURL = urlString
            .replacingOccurrences(of: "://img.reimg2.org/", with: "://img.reimg.org/")
        if primaryURL != urlString && primaryURL != fallbackURL,
           let image = await fetchImage(urlString: primaryURL) {
            return image
        }

        return nil
    }

    private static func fetchImage(urlString: String) async -> UIImage? {
        guard let url = URL(string: urlString) else { return nil }
        do {
            let (data, response) = try await session.data(from: url)
            guard let httpResponse = response as? HTTPURLResponse,
                  httpResponse.statusCode == 200 else {
                return nil
            }
            return UIImage(data: data)
        } catch {
            return nil
        }
    }
}

// MARK: - Manga Page Image View

struct MangaPageView: View {
    let urlString: String
    let aspectRatio: CGFloat
    let pageNumber: Int

    @State private var image: UIImage?
    @State private var loadState: LoadState = .idle

    enum LoadState {
        case idle, loading, loaded, failed
    }

    var body: some View {
        Group {
            if let image {
                Image(uiImage: image)
                    .resizable()
                    .aspectRatio(contentMode: .fit)
                    .frame(maxWidth: .infinity)
            } else {
                Rectangle()
                    .fill(Color.gray.opacity(0.1))
                    .aspectRatio(aspectRatio, contentMode: .fit)
                    .frame(maxWidth: .infinity)
                    .overlay {
                        if loadState == .failed {
                            VStack(spacing: 8) {
                                Image(systemName: "exclamationmark.triangle")
                                    .font(.title2)
                                    .foregroundStyle(.white.opacity(0.5))
                                Text("Page \(pageNumber)")
                                    .font(.caption)
                                    .foregroundStyle(.white.opacity(0.5))
                                Button("Tap to retry") {
                                    loadState = .idle
                                    loadImage()
                                }
                                .font(.caption2)
                                .foregroundStyle(AppColors.primary)
                            }
                        } else {
                            VStack(spacing: 8) {
                                ProgressView()
                                    .tint(.white)
                                Text("Page \(pageNumber)")
                                    .font(.caption)
                                    .foregroundStyle(.white.opacity(0.5))
                            }
                        }
                    }
            }
        }
        .onAppear {
            if loadState == .idle {
                loadImage()
            }
        }
    }

    private func loadImage() {
        guard loadState != .loading else { return }
        loadState = .loading

        Task {
            if let loaded = await MangaImageLoader.loadImage(urlString: urlString) {
                await MainActor.run {
                    self.image = loaded
                    loadState = .loaded
                }
            } else {
                await MainActor.run { loadState = .failed }
            }
        }
    }
}

#Preview {
    MangaReaderView(
        manga: Manga(
            id: "test",
            mainName: nil,
            secondaryName: "Test Manga",
            anotherName: nil,
            description: nil,
            status: nil,
            translateStatus: nil,
            year: nil,
            avgRating: nil,
            totalViews: nil,
            countChapters: nil,
            coverPath: nil,
            typeName: nil,
            genres: nil,
            branchId: nil
        ),
        chapter: Chapter(
            id: "1",
            volume: "1",
            chapter: "1",
            title: "The Beginning",
            pages: 20,
            publishAt: nil,
            scanlationGroup: nil,
            isPaid: false
        ),
        allChapters: []
    )
}
