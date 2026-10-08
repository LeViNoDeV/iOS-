import SwiftUI

extension Color {
    static let lifeGreen = Color(red: 0.20, green: 0.75, blue: 0.40)
    static let lifeBlue = Color(red: 0.16, green: 0.50, blue: 0.95)

    static func forStat(_ value: Int) -> Color {
        switch value {
        case ..<25: return .red
        case ..<50: return .orange
        case ..<75: return .yellow
        default: return .green
        }
    }
}

struct StatBar: View {
    let label: String
    let emoji: String
    let value: Int

    var body: some View {
        HStack(spacing: 8) {
            Text(emoji)
                .frame(width: 22)
            Text(label)
                .font(.subheadline.weight(.semibold))
                .lineLimit(1)
                .minimumScaleFactor(0.7)
                .frame(width: 84, alignment: .leading)
            GeometryReader { proxy in
                ZStack(alignment: .leading) {
                    Capsule().fill(Color.secondary.opacity(0.2))
                    Capsule()
                        .fill(Color.forStat(value))
                        .frame(width: max(6, proxy.size.width * CGFloat(value) / 100))
                }
            }
            .frame(height: 12)
            Text("\(value)%")
                .font(.caption.monospacedDigit())
                .frame(width: 40, alignment: .trailing)
        }
        .animation(.easeInOut, value: value)
    }
}

struct StatsPanel: View {
    let stats: Stats

    var body: some View {
        VStack(spacing: 6) {
            StatBar(label: "Happiness", emoji: "😊", value: stats.happiness)
            StatBar(label: "Health", emoji: "❤️", value: stats.health)
            StatBar(label: "Smarts", emoji: "🧠", value: stats.smarts)
            StatBar(label: "Looks", emoji: "✨", value: stats.looks)
        }
    }
}

struct ActionRow: View {
    let emoji: String
    let title: String
    var subtitle: String? = nil
    var enabled = true

    var body: some View {
        HStack(spacing: 12) {
            Text(emoji)
                .font(.title2)
                .frame(width: 36)
            VStack(alignment: .leading, spacing: 2) {
                Text(title).font(.body.weight(.medium))
                if let subtitle = subtitle {
                    Text(subtitle).font(.caption).foregroundStyle(.secondary)
                }
            }
            Spacer()
            Image(systemName: "chevron.right")
                .font(.caption)
                .foregroundStyle(.tertiary)
        }
        .contentShape(Rectangle())
        .opacity(enabled ? 1 : 0.4)
    }
}

/// Shows an `Outcome` as a standard alert.
struct OutcomeAlert: ViewModifier {
    @Binding var outcome: Outcome?

    func body(content: Content) -> some View {
        content.alert(
            outcome?.title ?? "",
            isPresented: Binding(
                get: { outcome != nil },
                set: { if !$0 { outcome = nil } }
            ),
            presenting: outcome
        ) { _ in
            Button("OK", role: .cancel) {}
        } message: { result in
            Text(result.message)
        }
    }
}

extension View {
    func outcomeAlert(_ outcome: Binding<Outcome?>) -> some View {
        modifier(OutcomeAlert(outcome: outcome))
    }
}

/// A BitLife-style popup that forces the player to make a choice.
struct EventCard: View {
    let event: PendingEvent
    let onChoose: (Int) -> Void

    var body: some View {
        ZStack {
            Color.black.opacity(0.45).ignoresSafeArea()
            VStack(spacing: 16) {
                Text(event.title)
                    .font(.title2.bold())
                Text(event.message)
                    .font(.body)
                    .multilineTextAlignment(.center)
                    .fixedSize(horizontal: false, vertical: true)
                VStack(spacing: 10) {
                    ForEach(Array(event.options.enumerated()), id: \.offset) { index, option in
                        Button {
                            onChoose(index)
                        } label: {
                            Text(option)
                                .font(.headline)
                                .frame(maxWidth: .infinity)
                                .padding(.vertical, 12)
                                .background(Color.lifeBlue, in: RoundedRectangle(cornerRadius: 12))
                                .foregroundStyle(.white)
                        }
                    }
                }
            }
            .padding(24)
            .background(.regularMaterial, in: RoundedRectangle(cornerRadius: 24))
            .padding(28)
        }
        .transition(.opacity.combined(with: .scale(scale: 0.9)))
    }
}
