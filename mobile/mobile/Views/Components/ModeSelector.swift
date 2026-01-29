//
//  ModeSelector.swift
//  mobile
//
//  LuAnime iOS App - Anime/Manga Mode Selector
//

import SwiftUI

struct ModeSelector: View {
    @Bindable var modeStore: AppModeStore

    var body: some View {
        HStack(spacing: 4) {
            ForEach(AppModeStore.AppMode.allCases) { mode in
                modeButton(mode)
            }
        }
        .padding(3)
        .liquidGlassCapsule()
    }

    private func modeButton(_ mode: AppModeStore.AppMode) -> some View {
        Button {
            modeStore.switchMode(mode)
        } label: {
            HStack(spacing: 6) {
                Image(systemName: mode.icon)
                    .font(.system(size: 12, weight: .medium))
                Text(mode.displayName)
                    .font(.system(size: 13, weight: .semibold))
            }
            .foregroundStyle(modeStore.currentMode == mode ? .white : AppColors.textSecondary)
            .padding(.horizontal, 12)
            .padding(.vertical, 6)
            .background {
                if modeStore.currentMode == mode {
                    Capsule()
                        .fill(AppColors.primary.opacity(0.4))
                }
            }
        }
        .buttonStyle(.plain)
    }
}

#Preview {
    ZStack {
        AppGradients.background
            .ignoresSafeArea()
        ModeSelector(modeStore: AppModeStore.shared)
    }
}
