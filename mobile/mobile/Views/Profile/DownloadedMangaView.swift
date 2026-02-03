//
//  DownloadedMangaView.swift
//  mobile
//
//  LuAnime iOS App - Downloaded Chapters for a Single Manga
//

import SwiftUI

struct DownloadedMangaView: View {
    let manga: Manga
    let chapters: [DownloadedChapter]

    @Environment(\.dismiss) private var dismiss
    @State private var readerChapter: (chapter: Chapter, allChapters: [Chapter])?

    private let mangaDownloadStore = MangaDownloadStore.shared

    private var currentChapters: [DownloadedChapter] {
        mangaDownloadStore.downloadedChapters
            .filter { $0.mangaId == manga.id }
            .sorted {
                let n0 = Double($0.chapterNumber ?? "") ?? 0
                let n1 = Double($1.chapterNumber ?? "") ?? 0
                return n0 < n1
            }
    }

    var body: some View {
        ZStack {
            AppGradients.background
                .ignoresSafeArea()

            ScrollView(showsIndicators: false) {
                VStack(spacing: 20) {
                    mangaHeader
                    chaptersList
                }
                .padding()
            }
        }
        .navigationBarBackButtonHidden(true)
        .toolbar {
            ToolbarItem(placement: .topBarLeading) {
                GlassIconButton(icon: "chevron.left", isToolbarItem: true) {
                    dismiss()
                }
            }

            ToolbarItem(placement: .topBarTrailing) {
                Button {
                    mangaDownloadStore.deleteAllForManga(mangaId: manga.id)
                    dismiss()
                } label: {
                    HStack(spacing: 4) {
                        Image(systemName: "trash")
                        Text("Delete All")
                    }
                    .font(.subheadline)
                    .foregroundStyle(AppColors.error)
                }
            }
        }
        .fullScreenCover(item: Binding(
            get: { readerChapter.map { ReaderBinding(chapter: $0.chapter, allChapters: $0.allChapters) } },
            set: { newValue in
                if newValue == nil { readerChapter = nil }
            }
        )) { binding in
            MangaReaderView(
                manga: manga,
                chapter: binding.chapter,
                allChapters: binding.allChapters
            )
        }
    }

    private var mangaHeader: some View {
        HStack(spacing: 16) {
            if let posterURL = manga.posterURL {
                AsyncImage(url: posterURL) { phase in
                    switch phase {
                    case .success(let image):
                        image
                            .resizable()
                            .aspectRatio(contentMode: .fill)
                    default:
                        RoundedRectangle(cornerRadius: 12)
                            .fill(AppColors.surface)
                    }
                }
                .frame(width: 80, height: 110)
                .clipShape(RoundedRectangle(cornerRadius: 12))
            }

            VStack(alignment: .leading, spacing: 8) {
                Text(manga.displayTitle)
                    .font(.title3)
                    .fontWeight(.bold)
                    .foregroundStyle(.white)
                    .lineLimit(2)

                let totalSize = currentChapters.reduce(Int64(0)) { $0 + $1.fileSize }
                Text("\(currentChapters.count) chapters")
                    .font(.subheadline)
                    .foregroundStyle(AppColors.textSecondary)

                Text(ByteCountFormatter.string(fromByteCount: totalSize, countStyle: .file))
                    .font(.caption)
                    .foregroundStyle(AppColors.textTertiary)
            }

            Spacer()
        }
        .padding()
        .background(AppColors.surface)
        .clipShape(RoundedRectangle(cornerRadius: 16))
    }

    private var chaptersList: some View {
        VStack(spacing: 8) {
            ForEach(currentChapters) { chapter in
                chapterRow(chapter)
            }
        }
    }

    private func chapterRow(_ chapter: DownloadedChapter) -> some View {
        HStack(spacing: 12) {
            // Read button
            Button {
                openReader(for: chapter)
            } label: {
                Image(systemName: "book.circle.fill")
                    .font(.title2)
                    .foregroundStyle(AppColors.primary)
            }

            VStack(alignment: .leading, spacing: 4) {
                Text(chapter.displayName)
                    .font(.subheadline)
                    .fontWeight(.medium)
                    .foregroundStyle(.white)

                HStack(spacing: 8) {
                    Text("\(chapter.pageCount) pages")
                    Text("\u{2022}")
                    Text(chapter.fileSizeFormatted)
                    Text("\u{2022}")
                    Text(chapter.downloadedAt, style: .date)
                }
                .font(.caption2)
                .foregroundStyle(AppColors.textTertiary)
            }

            Spacer()

            // Delete button
            Button {
                mangaDownloadStore.deleteDownload(mangaId: chapter.mangaId, chapterId: chapter.chapterId)
            } label: {
                Image(systemName: "trash")
                    .font(.subheadline)
                    .foregroundStyle(AppColors.error.opacity(0.8))
            }
        }
        .padding(12)
        .background(AppColors.surface)
        .clipShape(RoundedRectangle(cornerRadius: 12))
    }

    private func openReader(for downloaded: DownloadedChapter) {
        // Build Chapter objects from all downloaded chapters for navigation
        let allChapterObjects = currentChapters.map { ch in
            Chapter(
                id: ch.chapterId,
                volume: ch.volume,
                chapter: ch.chapterNumber,
                title: ch.chapterTitle,
                pages: ch.pageCount,
                publishAt: nil,
                scanlationGroup: nil,
                isPaid: false
            )
        }
        let currentChapter = Chapter(
            id: downloaded.chapterId,
            volume: downloaded.volume,
            chapter: downloaded.chapterNumber,
            title: downloaded.chapterTitle,
            pages: downloaded.pageCount,
            publishAt: nil,
            scanlationGroup: nil,
            isPaid: false
        )
        readerChapter = (chapter: currentChapter, allChapters: allChapterObjects)
    }
}

// Helper for fullScreenCover binding
private struct ReaderBinding: Identifiable {
    let id = UUID()
    let chapter: Chapter
    let allChapters: [Chapter]
}
