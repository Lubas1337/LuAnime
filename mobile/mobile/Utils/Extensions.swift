//
//  Extensions.swift
//  mobile
//
//  LuAnime iOS App - Extensions
//

import SwiftUI

// MARK: - Color Extension

extension Color {
    init(hex: String) {
        let hex = hex.trimmingCharacters(in: CharacterSet.alphanumerics.inverted)
        var int: UInt64 = 0
        Scanner(string: hex).scanHexInt64(&int)
        let a, r, g, b: UInt64
        switch hex.count {
        case 3:
            (a, r, g, b) = (255, (int >> 8) * 17, (int >> 4 & 0xF) * 17, (int & 0xF) * 17)
        case 6:
            (a, r, g, b) = (255, int >> 16, int >> 8 & 0xFF, int & 0xFF)
        case 8:
            (a, r, g, b) = (int >> 24, int >> 16 & 0xFF, int >> 8 & 0xFF, int & 0xFF)
        default:
            (a, r, g, b) = (1, 1, 1, 0)
        }
        self.init(
            .sRGB,
            red: Double(r) / 255,
            green: Double(g) / 255,
            blue: Double(b) / 255,
            opacity: Double(a) / 255
        )
    }
}

// MARK: - View Extensions

extension View {
    func glassBackground(cornerRadius: CGFloat = AppConstants.Layout.cornerRadius) -> some View {
        self
            .background(.ultraThinMaterial)
            .clipShape(RoundedRectangle(cornerRadius: cornerRadius))
    }

    func glassCard() -> some View {
        self
            .background(.ultraThinMaterial)
            .clipShape(RoundedRectangle(cornerRadius: AppConstants.Layout.cardCornerRadius))
            .shadow(color: .black.opacity(0.2), radius: 10, x: 0, y: 5)
    }

    func shimmer(isActive: Bool = true) -> some View {
        self
            .redacted(reason: isActive ? .placeholder : [])
            .shimmering(active: isActive)
    }

    @ViewBuilder
    func `if`<Content: View>(_ condition: Bool, transform: (Self) -> Content) -> some View {
        if condition {
            transform(self)
        } else {
            self
        }
    }

    func cardShadow() -> some View {
        self
            .shadow(color: .black.opacity(0.1), radius: 5, x: 0, y: 2)
            .shadow(color: AppColors.primary.opacity(0.1), radius: 10, x: 0, y: 5)
    }

    func hideKeyboard() {
        UIApplication.shared.sendAction(#selector(UIResponder.resignFirstResponder), to: nil, from: nil, for: nil)
    }

    // MARK: - iOS 26 Liquid Glass Effects

    /// Applies iOS 26 Liquid Glass effect with fallback for older versions
    @ViewBuilder
    func liquidGlass(cornerRadius: CGFloat = AppConstants.Layout.cornerRadius) -> some View {
        if #available(iOS 26.0, *) {
            self
                .glassEffect(.regular.tint(AppColors.primary.opacity(0.2)))
        } else {
            self
                .background(.ultraThinMaterial)
                .clipShape(RoundedRectangle(cornerRadius: cornerRadius))
        }
    }

    /// Applies iOS 26 Liquid Glass effect with interactive bounce
    @ViewBuilder
    func liquidGlassInteractive(cornerRadius: CGFloat = AppConstants.Layout.cornerRadius) -> some View {
        if #available(iOS 26.0, *) {
            self
                .glassEffect(.regular.interactive())
        } else {
            self
                .background(.ultraThinMaterial)
                .clipShape(RoundedRectangle(cornerRadius: cornerRadius))
        }
    }

    /// Applies clear glass effect for media overlays
    @ViewBuilder
    func liquidGlassClear(cornerRadius: CGFloat = AppConstants.Layout.cornerRadius) -> some View {
        if #available(iOS 26.0, *) {
            self
                .glassEffect(.clear)
        } else {
            self
                .background(.ultraThinMaterial.opacity(0.5))
                .clipShape(RoundedRectangle(cornerRadius: cornerRadius))
        }
    }

    /// Applies capsule-shaped glass effect for buttons
    @ViewBuilder
    func liquidGlassCapsule() -> some View {
        if #available(iOS 26.0, *) {
            self
                .glassEffect(.regular, in: .capsule)
        } else {
            self
                .background(.ultraThinMaterial)
                .clipShape(Capsule())
        }
    }

    /// Applies circular glass effect for icon buttons
    @ViewBuilder
    func liquidGlassCircle() -> some View {
        if #available(iOS 26.0, *) {
            self
                .glassEffect(.regular, in: .circle)
        } else {
            self
                .background(.ultraThinMaterial)
                .clipShape(Circle())
        }
    }

    /// Applies primary button glass effect with accent color
    @ViewBuilder
    func liquidGlassPrimaryButton() -> some View {
        if #available(iOS 26.0, *) {
            self
                .glassEffect(.regular.tint(AppColors.primary), in: .capsule)
        } else {
            self
                .background(AppColors.primary)
                .clipShape(Capsule())
        }
    }

    /// Applies secondary button glass effect
    @ViewBuilder
    func liquidGlassSecondaryButton() -> some View {
        if #available(iOS 26.0, *) {
            self
                .glassEffect(.regular.interactive(), in: .capsule)
        } else {
            self
                .background(.ultraThinMaterial)
                .clipShape(Capsule())
        }
    }
}

// MARK: - Shimmer Effect

struct Shimmer: ViewModifier {
    @State private var phase: CGFloat = 0
    var active: Bool

    func body(content: Content) -> some View {
        if active {
            content
                .overlay(
                    GeometryReader { geometry in
                        LinearGradient(
                            gradient: Gradient(colors: [
                                .clear,
                                .white.opacity(0.3),
                                .clear
                            ]),
                            startPoint: .leading,
                            endPoint: .trailing
                        )
                        .frame(width: geometry.size.width * 2)
                        .offset(x: -geometry.size.width + (geometry.size.width * 2 * phase))
                    }
                )
                .mask(content)
                .onAppear {
                    withAnimation(.linear(duration: 1.5).repeatForever(autoreverses: false)) {
                        phase = 1
                    }
                }
        } else {
            content
        }
    }
}

extension View {
    func shimmering(active: Bool = true) -> some View {
        modifier(Shimmer(active: active))
    }
}

// MARK: - String Extensions

extension String {
    var isValidEmail: Bool {
        let emailRegex = "[A-Z0-9a-z._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,64}"
        let emailPredicate = NSPredicate(format: "SELF MATCHES %@", emailRegex)
        return emailPredicate.evaluate(with: self)
    }

    var trimmed: String {
        trimmingCharacters(in: .whitespacesAndNewlines)
    }
}

// MARK: - Date Extensions

extension Date {
    var timeAgo: String {
        let formatter = RelativeDateTimeFormatter()
        formatter.unitsStyle = .abbreviated
        return formatter.localizedString(for: self, relativeTo: Date())
    }

    var formatted: String {
        let formatter = DateFormatter()
        formatter.dateStyle = .medium
        formatter.timeStyle = .short
        return formatter.string(from: self)
    }
}

// MARK: - Double Extensions

extension Double {
    var formattedDuration: String {
        let totalSeconds = Int(self)
        let hours = totalSeconds / 3600
        let minutes = (totalSeconds % 3600) / 60
        let seconds = totalSeconds % 60

        if hours > 0 {
            return String(format: "%d:%02d:%02d", hours, minutes, seconds)
        }
        return String(format: "%d:%02d", minutes, seconds)
    }
}

// MARK: - Animation Extensions

extension Animation {
    static var smoothSpring: Animation {
        .spring(response: AppConstants.Animation.springResponse,
                dampingFraction: AppConstants.Animation.springDamping)
    }

    static var quickSpring: Animation {
        .spring(response: 0.3, dampingFraction: 0.7)
    }
}

// MARK: - UIApplication Extension

extension UIApplication {
    var currentKeyWindow: UIWindow? {
        connectedScenes
            .compactMap { $0 as? UIWindowScene }
            .flatMap { $0.windows }
            .first { $0.isKeyWindow }
    }

    var safeAreaInsets: UIEdgeInsets {
        currentKeyWindow?.safeAreaInsets ?? .zero
    }
}
