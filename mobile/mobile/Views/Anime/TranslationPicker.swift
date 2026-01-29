//
//  TranslationPicker.swift
//  mobile
//
//  LuAnime iOS App - Translation Picker
//

import SwiftUI

struct TranslationPicker: View {
    let translations: [Translation]
    @Binding var selected: Translation?
    var onSelect: ((Translation) -> Void)?

    @State private var isExpanded = false

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            Button {
                withAnimation(.smoothSpring) {
                    isExpanded.toggle()
                }
            } label: {
                HStack {
                    VStack(alignment: .leading, spacing: 2) {
                        Text("Translation")
                            .font(.caption)
                            .foregroundStyle(AppColors.textSecondary)

                        Text(selected?.displayName ?? "Select")
                            .font(.subheadline)
                            .fontWeight(.medium)
                            .foregroundStyle(.white)
                    }

                    Spacer()

                    Image(systemName: "chevron.down")
                        .foregroundStyle(AppColors.textSecondary)
                        .rotationEffect(.degrees(isExpanded ? 180 : 0))
                }
                .padding(16)
                .liquidGlass(cornerRadius: AppConstants.Layout.cornerRadius)
            }

            if isExpanded {
                translationList
            }
        }
    }

    private var translationList: some View {
        VStack(spacing: 0) {
            ForEach(translations) { translation in
                TranslationRow(
                    translation: translation,
                    isSelected: selected?.id == translation.id
                ) {
                    selected = translation
                    onSelect?(translation)
                    withAnimation(.smoothSpring) {
                        isExpanded = false
                    }
                }
            }
        }
        .liquidGlass(cornerRadius: AppConstants.Layout.cornerRadius)
        .transition(.asymmetric(
            insertion: .opacity.combined(with: .move(edge: .top)),
            removal: .opacity.combined(with: .move(edge: .top))
        ))
    }
}

struct TranslationRow: View {
    let translation: Translation
    let isSelected: Bool
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            HStack {
                VStack(alignment: .leading, spacing: 4) {
                    HStack(spacing: 8) {
                        Text(translation.displayName)
                            .fontWeight(isSelected ? .semibold : .regular)
                            .foregroundStyle(.white)

                        if translation.isSub == true {
                            Text("SUB")
                                .font(.caption2)
                                .fontWeight(.bold)
                                .foregroundStyle(AppColors.primary)
                                .padding(.horizontal, 6)
                                .padding(.vertical, 2)
                                .background(AppColors.primary.opacity(0.2))
                                .clipShape(Capsule())
                        }
                    }

                    if let count = translation.episodesCount, count > 0 {
                        Text("\(count) episodes")
                            .font(.caption)
                            .foregroundStyle(AppColors.textSecondary)
                    }
                }

                Spacer()

                if isSelected {
                    Image(systemName: "checkmark")
                        .foregroundStyle(AppColors.primary)
                }
            }
            .padding(16)
        }
        .buttonStyle(.plain)
    }
}

struct SourcePicker: View {
    let sources: [VideoSource]
    @Binding var selected: VideoSource?
    var onSelect: ((VideoSource) -> Void)?

    var body: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: 8) {
                ForEach(sources) { source in
                    SourceChip(
                        source: source,
                        isSelected: selected?.id == source.id
                    ) {
                        selected = source
                        onSelect?(source)
                    }
                }
            }
        }
    }
}

struct SourceChip: View {
    let source: VideoSource
    let isSelected: Bool
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            HStack(spacing: 6) {
                Text(source.displayName)

                if let count = source.episodesCount, count > 0 {
                    Text("(\(count))")
                        .foregroundStyle(isSelected ? .white.opacity(0.7) : AppColors.textTertiary)
                }
            }
            .font(.subheadline)
            .fontWeight(isSelected ? .semibold : .regular)
            .foregroundStyle(isSelected ? .white : AppColors.textSecondary)
            .padding(.horizontal, 16)
            .padding(.vertical, 10)
            .sourceChipBackground(isSelected: isSelected)
        }
    }
}

extension View {
    @ViewBuilder
    func sourceChipBackground(isSelected: Bool) -> some View {
        if #available(iOS 26.0, *) {
            if isSelected {
                self.glassEffect(.regular.tint(AppColors.primary), in: .capsule)
            } else {
                self.glassEffect(.regular.interactive(), in: .capsule)
            }
        } else {
            self.background {
                if isSelected {
                    Capsule().fill(AppColors.primary)
                } else {
                    Capsule().fill(.ultraThinMaterial)
                }
            }
        }
    }
}

