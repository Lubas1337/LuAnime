//
//  GlassButton.swift
//  mobile
//
//  LuAnime iOS App - Glass Button Component with iOS 26 Liquid Glass Support
//

import SwiftUI

struct GlassButton: View {
    let title: String
    var icon: String?
    var style: GlassButtonStyle
    var isLoading: Bool
    let action: () -> Void

    init(
        _ title: String,
        icon: String? = nil,
        style: GlassButtonStyle = .primary,
        isLoading: Bool = false,
        action: @escaping () -> Void
    ) {
        self.title = title
        self.icon = icon
        self.style = style
        self.isLoading = isLoading
        self.action = action
    }

    var body: some View {
        Button(action: action) {
            HStack(spacing: 8) {
                if isLoading {
                    ProgressView()
                        .tint(style.foregroundColor)
                } else {
                    if let icon = icon {
                        Image(systemName: icon)
                    }
                    Text(title)
                        .fontWeight(.semibold)
                }
            }
            .frame(maxWidth: style == .small ? nil : .infinity)
            .padding(.horizontal, style.horizontalPadding)
            .padding(.vertical, style.verticalPadding)
            .foregroundStyle(style.foregroundColor)
            .liquidGlassButton(style: style)
        }
        .disabled(isLoading)
        .opacity(isLoading ? 0.7 : 1)
    }
}

// MARK: - Liquid Glass Button Modifier

extension View {
    @ViewBuilder
    func liquidGlassButton(style: GlassButtonStyle) -> some View {
        if #available(iOS 26.0, *) {
            switch style {
            case .primary:
                self
                    .glassEffect(.regular.tint(AppColors.primary), in: .capsule)
            case .secondary:
                self
                    .glassEffect(.regular.interactive(), in: .capsule)
            case .destructive:
                self
                    .glassEffect(.regular.tint(AppColors.error), in: .capsule)
            case .small:
                self
                    .glassEffect(.regular.interactive(), in: .capsule)
            case .ghost:
                self
                    .glassEffect(.clear, in: .capsule)
            }
        } else {
            self
                .background(style.background)
                .clipShape(Capsule())
                .shadow(color: style.shadowColor, radius: 5, x: 0, y: 2)
        }
    }
}

enum GlassButtonStyle {
    case primary
    case secondary
    case destructive
    case small
    case ghost

    var background: some ShapeStyle {
        switch self {
        case .primary:
            return AnyShapeStyle(AppColors.primary)
        case .secondary:
            return AnyShapeStyle(.ultraThinMaterial)
        case .destructive:
            return AnyShapeStyle(AppColors.error)
        case .small:
            return AnyShapeStyle(.ultraThinMaterial)
        case .ghost:
            return AnyShapeStyle(Color.clear)
        }
    }

    var foregroundColor: Color {
        switch self {
        case .primary, .destructive:
            return .white
        case .secondary, .small:
            return .white
        case .ghost:
            return AppColors.primary
        }
    }

    var shadowColor: Color {
        switch self {
        case .primary:
            return AppColors.primary.opacity(0.3)
        case .destructive:
            return AppColors.error.opacity(0.3)
        default:
            return .clear
        }
    }

    var horizontalPadding: CGFloat {
        switch self {
        case .small:
            return 16
        default:
            return 24
        }
    }

    var verticalPadding: CGFloat {
        switch self {
        case .small:
            return 10
        default:
            return 16
        }
    }
}

struct GlassIconButton: View {
    let icon: String
    var size: CGFloat
    var tint: Color
    var isToolbarItem: Bool
    let action: () -> Void

    init(
        icon: String,
        size: CGFloat = 44,
        tint: Color = .white,
        isToolbarItem: Bool = false,
        action: @escaping () -> Void
    ) {
        self.icon = icon
        self.size = size
        self.tint = tint
        self.isToolbarItem = isToolbarItem
        self.action = action
    }

    var body: some View {
        Button(action: action) {
            Image(systemName: icon)
                .font(.system(size: size * 0.4, weight: .medium))
                .foregroundStyle(tint)
                .frame(width: size, height: size)
                .modifier(GlassIconModifier(isToolbarItem: isToolbarItem))
        }
    }
}

// Modifier that applies glass effect only when not in toolbar on iOS 26
struct GlassIconModifier: ViewModifier {
    let isToolbarItem: Bool

    func body(content: Content) -> some View {
        if #available(iOS 26.0, *) {
            if isToolbarItem {
                // On iOS 26, toolbar already has glass - don't add double effect
                content
            } else {
                content
                    .glassEffect(.regular, in: .circle)
            }
        } else {
            content
                .background(.ultraThinMaterial)
                .clipShape(Circle())
        }
    }
}

#Preview {
    ZStack {
        AppGradients.background
            .ignoresSafeArea()

        VStack(spacing: 20) {
            GlassButton("Primary Button", icon: "play.fill", style: .primary) {}

            GlassButton("Secondary", style: .secondary) {}

            GlassButton("Destructive", icon: "trash", style: .destructive) {}

            HStack {
                GlassButton("Small", style: .small) {}
                GlassButton("Ghost", style: .ghost) {}
            }

            GlassButton("Loading...", style: .primary, isLoading: true) {}

            HStack(spacing: 16) {
                GlassIconButton(icon: "heart.fill", tint: AppColors.error) {}
                GlassIconButton(icon: "bookmark.fill") {}
                GlassIconButton(icon: "square.and.arrow.up") {}
            }
        }
        .padding()
    }
}
