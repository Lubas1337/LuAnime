//
//  ScheduleSection.swift
//  mobile
//
//  LuAnime iOS App - Schedule Section
//

import SwiftUI

struct ScheduleSection: View {
    let schedule: ScheduleResponse
    var onSelect: ((ScheduleAnime) -> Void)?

    @State private var selectedDay = Calendar.current.component(.weekday, from: Date()) - 2

    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            header
            daySelector
            scheduleList
        }
        .onAppear {
            // Adjust for Monday-indexed array (weekday is 1-7, Sunday=1)
            let weekday = Calendar.current.component(.weekday, from: Date())
            selectedDay = weekday == 1 ? 6 : weekday - 2 // Convert to 0-6 (Mon-Sun)
        }
    }

    private var header: some View {
        HStack {
            HStack(spacing: 8) {
                Image(systemName: "calendar")
                    .foregroundStyle(AppColors.primary)
                Text("Schedule")
                    .font(.title2)
                    .fontWeight(.bold)
                    .foregroundStyle(.white)
            }

            Spacer()
        }
        .padding(.horizontal)
    }

    private var daySelector: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: 8) {
                ForEach(Array(schedule.dayNames.enumerated()), id: \.offset) { index, day in
                    DayButton(
                        day: String(day.prefix(3)),
                        isSelected: selectedDay == index
                    ) {
                        withAnimation(.smoothSpring) {
                            selectedDay = index
                        }
                    }
                }
            }
            .padding(.horizontal)
        }
    }

    private var scheduleList: some View {
        let dayAnimes = schedule.allDays[safe: selectedDay] ?? []

        return ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: 12) {
                if dayAnimes.isEmpty {
                    Text("No releases scheduled")
                        .font(.subheadline)
                        .foregroundStyle(AppColors.textSecondary)
                        .padding(.horizontal)
                } else {
                    ForEach(dayAnimes) { anime in
                        ScheduleCard(anime: anime) {
                            onSelect?(anime)
                        }
                    }
                }
            }
            .padding(.horizontal)
        }
    }
}

struct DayButton: View {
    let day: String
    let isSelected: Bool
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            Text(day)
                .font(.subheadline)
                .fontWeight(isSelected ? .semibold : .regular)
                .foregroundStyle(isSelected ? .white : AppColors.textSecondary)
                .padding(.horizontal, 16)
                .padding(.vertical, 8)
                .dayButtonBackground(isSelected: isSelected)
        }
        .buttonStyle(.plain)
    }
}

extension View {
    @ViewBuilder
    func dayButtonBackground(isSelected: Bool) -> some View {
        if #available(iOS 26.0, *) {
            if isSelected {
                self.glassEffect(.regular.tint(AppColors.primary), in: .capsule)
            } else {
                self.glassEffect(.regular, in: .capsule)
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

struct ScheduleCard: View {
    let anime: ScheduleAnime
    var onTap: (() -> Void)?

    var body: some View {
        Button {
            onTap?()
        } label: {
            VStack(alignment: .leading, spacing: 8) {
                AnimePosterImage(
                    url: anime.posterURL,
                    cornerRadius: 12
                )
                .frame(width: 120, height: 170)

                VStack(alignment: .leading, spacing: 2) {
                    Text(anime.displayTitle)
                        .font(.caption)
                        .fontWeight(.medium)
                        .foregroundStyle(.white)
                        .lineLimit(2)

                    if let episodes = anime.episodesReleased {
                        Text("Ep. \(episodes)")
                            .font(.caption2)
                            .foregroundStyle(AppColors.primary)
                    }
                }
            }
            .frame(width: 120)
        }
        .buttonStyle(.plain)
    }
}

// MARK: - Safe Array Access

extension Array {
    subscript(safe index: Int) -> Element? {
        indices.contains(index) ? self[index] : nil
    }
}

