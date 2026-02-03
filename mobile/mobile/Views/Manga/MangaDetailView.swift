//
//  MangaDetailView.swift
//  mobile
//
//  LuAnime iOS App - Manga Detail View
//

import SwiftUI

struct MangaDetailView: View {
    let manga: Manga

    @State private var detailedManga: Manga?
    @State private var chapters: [Chapter] = []
    @State private var isLoading = true
    @State private var error: String?
    @State private var readerChapter: Chapter?

    @Environment(\.dismiss) private var dismiss

    private let mangaStore = MangaStore.shared
    private let mangaDownloadStore = MangaDownloadStore.shared

    /// Use detailedManga (with branchId, genres, description) if available, otherwise the passed-in manga
    private var displayManga: Manga {
        detailedManga ?? manga
    }

    var body: some View {
        ZStack {
            AppGradients.background
                .ignoresSafeArea()

            ScrollView(showsIndicators: false) {
                VStack(spacing: 0) {
                    heroSection
                    contentSection
                }
            }
            .ignoresSafeArea(edges: .top)
        }
        .navigationBarBackButtonHidden(true)
        .toolbar {
            ToolbarItem(placement: .topBarLeading) {
                GlassIconButton(icon: "chevron.left", isToolbarItem: true) {
                    dismiss()
                }
            }

            ToolbarItem(placement: .topBarTrailing) {
                HStack(spacing: 12) {
                    GlassIconButton(
                        icon: mangaStore.isFavorite(displayManga.id) ? "heart.fill" : "heart",
                        tint: mangaStore.isFavorite(displayManga.id) ? AppColors.error : .white,
                        isToolbarItem: true
                    ) {
                        mangaStore.toggleFavorite(manga: displayManga)
                    }
                }
            }
        }
        .task {
            await loadDetail()
        }
        .fullScreenCover(item: $readerChapter) { chapter in
            MangaReaderView(
                manga: displayManga,
                chapter: chapter,
                allChapters: chapters
            )
        }
    }

    // MARK: - Hero Section

    private var heroSection: some View {
        GeometryReader { geometry in
            let minY = geometry.frame(in: .global).minY
            let height = max(AppConstants.Layout.bannerHeight, AppConstants.Layout.bannerHeight + minY)

            ZStack(alignment: .bottom) {
                AnimeBannerImage(url: displayManga.posterURL)
                    .frame(width: geometry.size.width, height: height)
                    .clipped()
                    .offset(y: minY > 0 ? -minY : 0)

                LinearGradient(
                    colors: [.clear, AppColors.background],
                    startPoint: .center,
                    endPoint: .bottom
                )
            }
            .frame(height: height)
        }
        .frame(height: AppConstants.Layout.bannerHeight)
    }

    // MARK: - Content Section

    private var contentSection: some View {
        VStack(alignment: .leading, spacing: 24) {
            titleSection
            metadataSection

            // Continue reading button
            if let lastRead = mangaStore.getLastRead(mangaId: displayManga.id),
               let chapter = chapters.first(where: { $0.id == lastRead.chapterId }) {
                continueReadingButton(chapter: chapter, progress: lastRead)
            }

            if let description = displayManga.cleanDescription, !description.isEmpty {
                descriptionSection(description)
            }

            if !displayManga.genresList.isEmpty {
                tagsSection
            }

            chaptersSection

        }
        .padding(.horizontal)
        .padding(.top, -60)
    }

    private var titleSection: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text(displayManga.displayTitle)
                .font(.title)
                .fontWeight(.bold)
                .foregroundStyle(.white)

            if let mainName = displayManga.mainName,
               mainName != displayManga.displayTitle {
                Text(mainName)
                    .font(.subheadline)
                    .foregroundStyle(AppColors.textSecondary)
            }

            // Rating
            if let rating = displayManga.ratingValue, rating > 0 {
                HStack(spacing: 4) {
                    Image(systemName: "star.fill")
                        .foregroundStyle(AppColors.rating)
                    Text(String(format: "%.1f", rating))
                        .fontWeight(.semibold)
                }
                .font(.subheadline)
                .foregroundStyle(AppColors.rating)
            }
        }
    }

    private var metadataSection: some View {
        HStack(spacing: 16) {
            if let year = displayManga.year {
                metadataItem(icon: "calendar", value: String(year))
            }

            if displayManga.status != nil {
                metadataItem(
                    icon: "circle.fill",
                    value: displayManga.statusDisplay,
                    color: statusColorValue(displayManga.statusDisplay)
                )
            }

            if let typeName = displayManga.typeName {
                metadataItem(icon: "book", value: typeName)
            }

            if !chapters.isEmpty {
                metadataItem(icon: "list.number", value: "\(chapters.count) ch.")
            }
        }
    }

    private func metadataItem(icon: String, value: String, color: Color = .white) -> some View {
        HStack(spacing: 4) {
            Image(systemName: icon)
                .foregroundStyle(color)
            Text(value)
        }
        .font(.caption)
        .foregroundStyle(AppColors.textSecondary)
        .padding(.horizontal, 12)
        .padding(.vertical, 6)
        .liquidGlassCapsule()
    }

    private func continueReadingButton(chapter: Chapter, progress: MangaReadingProgress) -> some View {
        Button {
            readerChapter = chapter
        } label: {
            HStack {
                VStack(alignment: .leading, spacing: 4) {
                    Text("Continue Reading")
                        .font(.headline)
                        .foregroundStyle(.white)
                    Text("\(chapter.displayName) - Page \(progress.currentPage + 1)/\(progress.totalPages)")
                        .font(.caption)
                        .foregroundStyle(AppColors.textSecondary)
                }

                Spacer()

                Image(systemName: "book.fill")
                    .font(.title2)
                    .foregroundStyle(AppColors.primary)
            }
            .padding(16)
            .liquidGlass(cornerRadius: 16)
        }
        .buttonStyle(.plain)
    }

    private func descriptionSection(_ description: String) -> some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Description")
                .font(.headline)
                .foregroundStyle(.white)

            Text(description)
                .font(.subheadline)
                .foregroundStyle(AppColors.textSecondary)
                .lineLimit(5)
        }
    }

    private var tagsSection: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Genres")
                .font(.headline)
                .foregroundStyle(.white)

            FlowLayout(spacing: 8) {
                ForEach(displayManga.genresList, id: \.self) { genre in
                    Text(genre)
                        .font(.caption)
                        .foregroundStyle(.white)
                        .padding(.horizontal, 12)
                        .padding(.vertical, 6)
                        .liquidGlassCapsule()
                }
            }
        }
    }

    // MARK: - Chapters Section

    private var chaptersSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Text("Chapters")
                    .font(.headline)
                    .foregroundStyle(.white)

                Spacer()

                if !chapters.isEmpty {
                    Button {
                        mangaDownloadStore.downloadAllChapters(
                            manga: displayManga,
                            chapters: chapters.filter { !$0.isPaid }
                        )
                    } label: {
                        Image(systemName: "arrow.down.circle")
                            .font(.title3)
                            .foregroundStyle(AppColors.primary)
                    }
                }

                if isLoading {
                    ProgressView()
                        .tint(AppColors.primary)
                }
            }

            if let error {
                Text(error)
                    .font(.caption)
                    .foregroundStyle(AppColors.error)
            } else if chapters.isEmpty && !isLoading {
                Text("No chapters available")
                    .font(.subheadline)
                    .foregroundStyle(AppColors.textSecondary)
            } else {
                LazyVStack(spacing: 2) {
                    ForEach(chapters) { chapter in
                        chapterRow(chapter)
                    }
                }
            }
        }
    }

    private func chapterRow(_ chapter: Chapter) -> some View {
        Button {
            guard !chapter.isPaid else { return }
            readerChapter = chapter
        } label: {
            HStack {
                VStack(alignment: .leading, spacing: 4) {
                    HStack(spacing: 6) {
                        Text(chapter.displayName)
                            .font(.subheadline)
                            .fontWeight(.medium)
                            .foregroundStyle(chapter.isPaid ? AppColors.textTertiary : .white)

                        if chapter.isPaid {
                            Image(systemName: "lock.fill")
                                .font(.caption2)
                                .foregroundStyle(AppColors.warning)
                        }
                    }

                    HStack(spacing: 8) {
                        if let group = chapter.scanlationGroup {
                            Text(group)
                                .font(.caption2)
                                .foregroundStyle(AppColors.textTertiary)
                        }
                    }
                }

                Spacer()

                // Download status indicator
                chapterDownloadIndicator(chapter)

                // Progress indicator
                if let progress = mangaStore.getProgress(mangaId: displayManga.id, chapterId: chapter.id) {
                    if progress.isCompleted {
                        Image(systemName: "checkmark.circle.fill")
                            .foregroundStyle(AppColors.success)
                    } else {
                        CircularProgressView(progress: progress.progress)
                            .frame(width: 20, height: 20)
                    }
                }

                Image(systemName: "chevron.right")
                    .font(.caption)
                    .foregroundStyle(AppColors.textTertiary)
            }
            .padding(.horizontal, 16)
            .padding(.vertical, 12)
            .contentShape(Rectangle())
        }
        .buttonStyle(.plain)
        .contextMenu {
            if mangaDownloadStore.isDownloaded(mangaId: displayManga.id, chapterId: chapter.id) {
                Button(role: .destructive) {
                    mangaDownloadStore.deleteDownload(mangaId: displayManga.id, chapterId: chapter.id)
                } label: {
                    Label("Delete Download", systemImage: "trash")
                }
            } else if !chapter.isPaid {
                Button {
                    mangaDownloadStore.downloadChapter(manga: displayManga, chapter: chapter)
                } label: {
                    Label("Download", systemImage: "arrow.down.circle")
                }
            }
        }
    }

    @ViewBuilder
    private func chapterDownloadIndicator(_ chapter: Chapter) -> some View {
        let key = "\(displayManga.id)-\(chapter.id)"
        if mangaDownloadStore.isDownloaded(mangaId: displayManga.id, chapterId: chapter.id) {
            Image(systemName: "arrow.down.circle.fill")
                .font(.caption)
                .foregroundStyle(AppColors.success)
        } else if let task = mangaDownloadStore.activeDownloads[key] {
            switch task.status {
            case .waiting:
                Image(systemName: "clock")
                    .font(.caption)
                    .foregroundStyle(AppColors.textTertiary)
            case .downloading:
                CircularProgressView(progress: task.progress)
                    .frame(width: 16, height: 16)
            case .failed:
                Image(systemName: "exclamationmark.circle")
                    .font(.caption)
                    .foregroundStyle(AppColors.error)
            }
        }
    }

    private func statusColorValue(_ status: String) -> Color {
        switch status {
        case "Ongoing": return AppColors.success
        case "Completed": return AppColors.primary
        case "Hiatus": return AppColors.warning
        case "Dropped": return AppColors.error
        default: return AppColors.textSecondary
        }
    }

    // MARK: - Data Loading

    @MainActor
    private func loadDetail() async {
        isLoading = true
        error = nil

        do {
            // First fetch detail to get branchId, genres, description
            let detail = try await ReMangaService.shared.getManga(dir: manga.id)
            detailedManga = detail

            // Then fetch chapters using branchId
            if let branchId = detail.branchId {
                chapters = try await ReMangaService.shared.getChapters(branchId: branchId)
            }
            isLoading = false
        } catch {
            self.error = error.localizedDescription
            isLoading = false
        }
    }
}

// MARK: - Circular Progress View

struct CircularProgressView: View {
    let progress: Double

    var body: some View {
        ZStack {
            Circle()
                .stroke(AppColors.surface, lineWidth: 2)

            Circle()
                .trim(from: 0, to: progress)
                .stroke(AppColors.primary, style: StrokeStyle(lineWidth: 2, lineCap: .round))
                .rotationEffect(.degrees(-90))
        }
    }
}

// MARK: - Flow Layout

struct FlowLayout: Layout {
    var spacing: CGFloat = 8

    func sizeThatFits(proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) -> CGSize {
        let result = arrangeSubviews(proposal: proposal, subviews: subviews)
        return result.size
    }

    func placeSubviews(in bounds: CGRect, proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) {
        let result = arrangeSubviews(proposal: proposal, subviews: subviews)
        for (index, position) in result.positions.enumerated() {
            subviews[index].place(at: CGPoint(x: bounds.minX + position.x, y: bounds.minY + position.y), proposal: .unspecified)
        }
    }

    private func arrangeSubviews(proposal: ProposedViewSize, subviews: Subviews) -> (size: CGSize, positions: [CGPoint]) {
        let maxWidth = proposal.width ?? .infinity
        var positions: [CGPoint] = []
        var currentX: CGFloat = 0
        var currentY: CGFloat = 0
        var lineHeight: CGFloat = 0

        for subview in subviews {
            let size = subview.sizeThatFits(.unspecified)

            if currentX + size.width > maxWidth && currentX > 0 {
                currentX = 0
                currentY += lineHeight + spacing
                lineHeight = 0
            }

            positions.append(CGPoint(x: currentX, y: currentY))
            currentX += size.width + spacing
            lineHeight = max(lineHeight, size.height)
        }

        return (CGSize(width: maxWidth, height: currentY + lineHeight), positions)
    }
}

#Preview {
    NavigationStack {
        MangaDetailView(manga: Manga(
            id: "even-the-absolute-father-is-a-first-timer",
            mainName: "Test",
            secondaryName: "One Piece",
            anotherName: nil,
            description: nil,
            status: "Продолжается",
            translateStatus: nil,
            year: 1997,
            avgRating: "9.0",
            totalViews: nil,
            countChapters: nil,
            coverPath: nil,
            typeName: "Манхва",
            genres: nil,
            branchId: nil
        ))
    }
}
