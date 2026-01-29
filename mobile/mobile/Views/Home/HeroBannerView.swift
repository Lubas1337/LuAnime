//
//  HeroBannerView.swift
//  mobile
//
//  LuAnime iOS App - Hero Banner View
//

import SwiftUI

struct HeroBannerView: View {
    let items: [DiscoverItem]
    var onItemTap: ((DiscoverItem) -> Void)?

    @State private var currentIndex = 0
    @State private var timer: Timer?

    var body: some View {
        VStack(spacing: 16) {
            TabView(selection: $currentIndex) {
                ForEach(Array(items.enumerated()), id: \.element.id) { index, item in
                    BannerCard(item: item) {
                        onItemTap?(item)
                    }
                    .tag(index)
                }
            }
            .tabViewStyle(.page(indexDisplayMode: .never))
            .frame(height: AppConstants.Layout.bannerHeight)

            pageIndicator
        }
        .onAppear {
            startAutoScroll()
        }
        .onDisappear {
            stopAutoScroll()
        }
    }

    private var pageIndicator: some View {
        HStack(spacing: 8) {
            ForEach(0..<items.count, id: \.self) { index in
                Circle()
                    .fill(index == currentIndex ? AppColors.primary : AppColors.textTertiary)
                    .frame(width: index == currentIndex ? 8 : 6, height: index == currentIndex ? 8 : 6)
                    .animation(.smoothSpring, value: currentIndex)
            }
        }
    }

    private func startAutoScroll() {
        timer = Timer.scheduledTimer(withTimeInterval: 5, repeats: true) { _ in
            withAnimation(.smoothSpring) {
                currentIndex = (currentIndex + 1) % max(items.count, 1)
            }
        }
    }

    private func stopAutoScroll() {
        timer?.invalidate()
        timer = nil
    }
}

struct BannerCard: View {
    let item: DiscoverItem
    var onTap: (() -> Void)?

    var body: some View {
        Button {
            onTap?()
        } label: {
            GeometryReader { geometry in
                ZStack(alignment: .bottomLeading) {
                    AnimeBannerImage(url: item.imageURL)
                        .frame(width: geometry.size.width, height: geometry.size.height)
                        .clipped()

                    LinearGradient(
                        colors: [.clear, .black.opacity(0.8)],
                        startPoint: .top,
                        endPoint: .bottom
                    )

                    VStack(alignment: .leading, spacing: 8) {
                        if let title = item.title {
                            Text(title)
                                .font(.title2)
                                .fontWeight(.bold)
                                .foregroundStyle(.white)
                                .lineLimit(2)
                        }

                        if let description = item.description {
                            Text(description)
                                .font(.subheadline)
                                .foregroundStyle(.white.opacity(0.8))
                                .lineLimit(2)
                        }

                        HStack {
                            Text("Watch Now")
                                .font(.subheadline)
                                .fontWeight(.semibold)
                                .foregroundStyle(.white)
                                .padding(.horizontal, 16)
                                .padding(.vertical, 8)
                                .liquidGlassPrimaryButton()

                            Spacer()
                        }
                    }
                    .padding(20)
                }
            }
            .clipShape(RoundedRectangle(cornerRadius: AppConstants.Layout.cardCornerRadius))
            .padding(.horizontal)
        }
        .buttonStyle(.plain)
    }
}

#Preview {
    ZStack {
        AppGradients.background
            .ignoresSafeArea()

        HeroBannerView(
            items: [
                DiscoverItem(id: 1, title: "Attack on Titan", description: "The final season is here", image: nil, type: 1, action: "/anime/1"),
                DiscoverItem(id: 2, title: "Jujutsu Kaisen", description: "New episodes available", image: nil, type: 1, action: "/anime/2")
            ]
        )
    }
}
