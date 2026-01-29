//
//  ImageLoader.swift
//  mobile
//
//  LuAnime iOS App - Async Image Loader with Caching
//

import SwiftUI

actor ImageCache {
    static let shared = ImageCache()

    private var cache = NSCache<NSString, UIImage>()
    private var loadingTasks = [String: Task<UIImage?, Never>]()

    private init() {
        cache.countLimit = 100
        cache.totalCostLimit = 50 * 1024 * 1024 // 50MB
    }

    func image(for url: URL) async -> UIImage? {
        let key = url.absoluteString as NSString

        if let cached = cache.object(forKey: key) {
            return cached
        }

        if let existingTask = loadingTasks[url.absoluteString] {
            return await existingTask.value
        }

        let task = Task<UIImage?, Never> {
            do {
                let (data, _) = try await URLSession.shared.data(from: url)
                if let image = UIImage(data: data) {
                    cache.setObject(image, forKey: key)
                    return image
                }
            } catch {
                print("Image loading error: \(error)")
            }
            return nil
        }

        loadingTasks[url.absoluteString] = task
        let image = await task.value
        loadingTasks.removeValue(forKey: url.absoluteString)

        return image
    }

    func clearCache() {
        cache.removeAllObjects()
    }
}

struct CachedAsyncImage<Content: View, Placeholder: View>: View {
    let url: URL?
    let content: (Image) -> Content
    let placeholder: () -> Placeholder

    @State private var image: UIImage?
    @State private var isLoading = false

    init(
        url: URL?,
        @ViewBuilder content: @escaping (Image) -> Content,
        @ViewBuilder placeholder: @escaping () -> Placeholder
    ) {
        self.url = url
        self.content = content
        self.placeholder = placeholder
    }

    var body: some View {
        Group {
            if let image = image {
                content(Image(uiImage: image))
            } else {
                placeholder()
                    .onAppear {
                        loadImage()
                    }
            }
        }
    }

    private func loadImage() {
        guard let url = url, !isLoading else { return }
        isLoading = true

        Task {
            let loadedImage = await ImageCache.shared.image(for: url)
            await MainActor.run {
                self.image = loadedImage
                self.isLoading = false
            }
        }
    }
}

extension CachedAsyncImage where Placeholder == ProgressView<EmptyView, EmptyView> {
    init(
        url: URL?,
        @ViewBuilder content: @escaping (Image) -> Content
    ) {
        self.init(url: url, content: content, placeholder: { ProgressView() })
    }
}

struct AnimePosterImage: View {
    let url: URL?
    var cornerRadius: CGFloat = AppConstants.Layout.cornerRadius

    var body: some View {
        CachedAsyncImage(url: url) { image in
            image
                .resizable()
                .aspectRatio(contentMode: .fill)
        } placeholder: {
            Rectangle()
                .fill(AppColors.surface)
                .overlay {
                    ProgressView()
                        .tint(AppColors.primary)
                }
        }
        .clipShape(RoundedRectangle(cornerRadius: cornerRadius))
    }
}

struct AnimeBannerImage: View {
    let url: URL?

    var body: some View {
        CachedAsyncImage(url: url) { image in
            image
                .resizable()
                .aspectRatio(contentMode: .fill)
        } placeholder: {
            Rectangle()
                .fill(AppColors.backgroundSecondary)
                .overlay {
                    ProgressView()
                        .tint(AppColors.primary)
                }
        }
    }
}
