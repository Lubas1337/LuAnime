//
//  GlassTabBar.swift
//  mobile
//
//  LuAnime iOS App - Glass Tab Bar Component with iOS 26 Liquid Glass
//

import SwiftUI

enum TabItem: String, CaseIterable {
    case home = "house"
    case search = "magnifyingglass"
    case favorites = "heart"
    case profile = "person"

    var title: String {
        switch self {
        case .home: return "Home"
        case .search: return "Search"
        case .favorites: return "Favorites"
        case .profile: return "Profile"
        }
    }

    var icon: String {
        rawValue
    }

    var selectedIcon: String {
        switch self {
        case .home: return "house.fill"
        case .search: return "magnifyingglass"
        case .favorites: return "heart.fill"
        case .profile: return "person.fill"
        }
    }
}

struct GlassTabBar: View {
    @Binding var selectedTab: TabItem
    @Namespace private var animation

    var body: some View {
        if #available(iOS 26.0, *) {
            liquidGlassTabBar
        } else {
            legacyTabBar
        }
    }

    // MARK: - iOS 26 Liquid Glass Tab Bar

    @available(iOS 26.0, *)
    private var liquidGlassTabBar: some View {
        HStack(spacing: 0) {
            ForEach(TabItem.allCases, id: \.self) { tab in
                liquidGlassTabButton(tab)
            }
        }
        .padding(.horizontal, 8)
        .padding(.vertical, 12)
        .glassEffect(.regular.tint(AppColors.primary.opacity(0.1)), in: .capsule)
        .padding(.horizontal, 24)
        .padding(.bottom, 8)
    }

    @available(iOS 26.0, *)
    private func liquidGlassTabButton(_ tab: TabItem) -> some View {
        Button {
            withAnimation(.smoothSpring) {
                selectedTab = tab
            }
        } label: {
            VStack(spacing: 4) {
                ZStack {
                    if selectedTab == tab {
                        Circle()
                            .fill(AppColors.primary.opacity(0.2))
                            .matchedGeometryEffect(id: "tabBackground", in: animation)
                    }

                    Image(systemName: selectedTab == tab ? tab.selectedIcon : tab.icon)
                        .font(.system(size: 22))
                        .foregroundStyle(selectedTab == tab ? AppColors.primary : .white.opacity(0.6))
                        .symbolEffect(.bounce, value: selectedTab == tab)
                }
                .frame(width: 44, height: 44)

                Text(tab.title)
                    .font(.caption2)
                    .fontWeight(selectedTab == tab ? .semibold : .regular)
                    .foregroundStyle(selectedTab == tab ? AppColors.primary : .white.opacity(0.6))
            }
            .frame(maxWidth: .infinity)
        }
        .buttonStyle(.plain)
    }

    // MARK: - Legacy Tab Bar (iOS 17/18)

    private var legacyTabBar: some View {
        HStack(spacing: 0) {
            ForEach(TabItem.allCases, id: \.self) { tab in
                tabButton(tab)
            }
        }
        .padding(.horizontal, 8)
        .padding(.vertical, 12)
        .background(.ultraThinMaterial)
        .clipShape(Capsule())
        .shadow(color: .black.opacity(0.2), radius: 10, x: 0, y: 5)
        .padding(.horizontal, 24)
        .padding(.bottom, 8)
    }

    private func tabButton(_ tab: TabItem) -> some View {
        Button {
            withAnimation(.smoothSpring) {
                selectedTab = tab
            }
        } label: {
            VStack(spacing: 4) {
                ZStack {
                    if selectedTab == tab {
                        Circle()
                            .fill(AppColors.primary.opacity(0.2))
                            .matchedGeometryEffect(id: "tabBackground", in: animation)
                    }

                    Image(systemName: selectedTab == tab ? tab.selectedIcon : tab.icon)
                        .font(.system(size: 22))
                        .foregroundStyle(selectedTab == tab ? AppColors.primary : .white.opacity(0.6))
                }
                .frame(width: 44, height: 44)

                Text(tab.title)
                    .font(.caption2)
                    .fontWeight(selectedTab == tab ? .semibold : .regular)
                    .foregroundStyle(selectedTab == tab ? AppColors.primary : .white.opacity(0.6))
            }
            .frame(maxWidth: .infinity)
        }
        .buttonStyle(.plain)
    }
}

struct CustomTabView<Content: View>: View {
    @Binding var selectedTab: TabItem
    @ViewBuilder let content: (TabItem) -> Content

    var body: some View {
        ZStack(alignment: .bottom) {
            content(selectedTab)
                .frame(maxWidth: .infinity, maxHeight: .infinity)

            GlassTabBar(selectedTab: $selectedTab)
        }
    }
}

// MARK: - Glass Effect Container for Morphing

/// A container that enables iOS 26 glass morphing between child elements
/// Elements placed close together will visually merge their glass effects
struct GlassEffectContainer<Content: View>: View {
    let spacing: CGFloat
    let content: Content

    init(spacing: CGFloat = 20, @ViewBuilder content: () -> Content) {
        self.spacing = spacing
        self.content = content()
    }

    var body: some View {
        if #available(iOS 26.0, *) {
            GlassEffectContainerInner(spacing: spacing) {
                content
            }
        } else {
            VStack(spacing: spacing) {
                content
            }
        }
    }
}

@available(iOS 26.0, *)
private struct GlassEffectContainerInner<Content: View>: View {
    let spacing: CGFloat
    let content: Content
    @Namespace private var glassNamespace

    init(spacing: CGFloat, @ViewBuilder content: () -> Content) {
        self.spacing = spacing
        self.content = content()
    }

    var body: some View {
        VStack(spacing: spacing) {
            content
        }
        .environment(\.glassEffectContainerNamespace, glassNamespace)
    }
}

// MARK: - Glass Effect ID Modifier

extension View {
    /// Assigns a unique ID to this view for glass effect morphing within a GlassEffectContainer
    @ViewBuilder
    func glassEffectID<ID: Hashable>(_ id: ID, in namespace: Namespace.ID) -> some View {
        if #available(iOS 26.0, *) {
            self.glassEffectID(id, in: namespace)
        } else {
            self
        }
    }
}

// MARK: - Environment Key for Glass Namespace

private struct GlassEffectContainerNamespaceKey: EnvironmentKey {
    static let defaultValue: Namespace.ID? = nil
}

extension EnvironmentValues {
    var glassEffectContainerNamespace: Namespace.ID? {
        get { self[GlassEffectContainerNamespaceKey.self] }
        set { self[GlassEffectContainerNamespaceKey.self] = newValue }
    }
}

#Preview {
    struct PreviewWrapper: View {
        @State private var selectedTab: TabItem = .home

        var body: some View {
            ZStack {
                AppGradients.background
                    .ignoresSafeArea()

                CustomTabView(selectedTab: $selectedTab) { tab in
                    VStack {
                        Text(tab.title)
                            .font(.largeTitle)
                            .foregroundStyle(.white)
                    }
                }
            }
        }
    }

    return PreviewWrapper()
}
