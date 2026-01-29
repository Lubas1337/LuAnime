//
//  GlassCard.swift
//  mobile
//
//  LuAnime iOS App - Glass Card Component with iOS 26 Liquid Glass Support
//

import SwiftUI

struct GlassCard<Content: View>: View {
    let content: Content
    var cornerRadius: CGFloat
    var padding: CGFloat
    var isInteractive: Bool

    init(
        cornerRadius: CGFloat = AppConstants.Layout.cardCornerRadius,
        padding: CGFloat = AppConstants.Layout.padding,
        isInteractive: Bool = false,
        @ViewBuilder content: () -> Content
    ) {
        self.cornerRadius = cornerRadius
        self.padding = padding
        self.isInteractive = isInteractive
        self.content = content()
    }

    var body: some View {
        content
            .padding(padding)
            .liquidGlassCard(cornerRadius: cornerRadius, isInteractive: isInteractive)
    }
}

struct GlassSurface: View {
    var cornerRadius: CGFloat = AppConstants.Layout.cornerRadius

    var body: some View {
        if #available(iOS 26.0, *) {
            RoundedRectangle(cornerRadius: cornerRadius)
                .fill(.clear)
                .glassEffect(.regular.tint(AppColors.primary.opacity(0.1)))
        } else {
            RoundedRectangle(cornerRadius: cornerRadius)
                .fill(.ultraThinMaterial)
                .shadow(color: .black.opacity(0.1), radius: 5, x: 0, y: 2)
        }
    }
}

struct GlassCardModifier: ViewModifier {
    var cornerRadius: CGFloat = AppConstants.Layout.cardCornerRadius
    var isInteractive: Bool = false

    func body(content: Content) -> some View {
        content
            .liquidGlassCard(cornerRadius: cornerRadius, isInteractive: isInteractive)
    }
}

extension View {
    func glassCardStyle(cornerRadius: CGFloat = AppConstants.Layout.cardCornerRadius) -> some View {
        modifier(GlassCardModifier(cornerRadius: cornerRadius))
    }

    /// Applies iOS 26 Liquid Glass card effect with proper shadow and tint
    @ViewBuilder
    func liquidGlassCard(cornerRadius: CGFloat = AppConstants.Layout.cardCornerRadius, isInteractive: Bool = false) -> some View {
        if #available(iOS 26.0, *) {
            if isInteractive {
                self
                    .glassEffect(.regular.interactive().tint(AppColors.primary.opacity(0.15)))
            } else {
                self
                    .glassEffect(.regular.tint(AppColors.primary.opacity(0.15)))
            }
        } else {
            self
                .background(.ultraThinMaterial)
                .clipShape(RoundedRectangle(cornerRadius: cornerRadius))
                .shadow(color: .black.opacity(0.1), radius: 10, x: 0, y: 5)
        }
    }
}

#Preview {
    ZStack {
        AppGradients.background
            .ignoresSafeArea()

        VStack(spacing: 20) {
            GlassCard {
                VStack(alignment: .leading, spacing: 8) {
                    Text("Glass Card")
                        .font(.headline)
                        .foregroundStyle(.white)

                    Text("This is a beautiful glass effect card with blur and transparency")
                        .font(.subheadline)
                        .foregroundStyle(.white.opacity(0.7))
                }
            }
            .frame(maxWidth: .infinity)

            Text("Content with modifier")
                .padding()
                .glassCardStyle()
        }
        .padding()
    }
}
