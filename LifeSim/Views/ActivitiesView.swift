import SwiftUI

struct ActivitiesView: View {
    @EnvironmentObject private var store: GameStore
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        if let life = store.life {
            List {
                if life.inPrison {
                    Section("Prison · \(life.prisonYearsLeft) year\(life.prisonYearsLeft == 1 ? "" : "s") left") {
                        ForEach(PrisonAction.allCases) { action in
                            Button { store.run { $0.perform(action) } } label: {
                                ActionRow(emoji: action.emoji, title: action.title)
                            }
                        }
                    }
                } else {
                    activitySection("Mind & Body", Activity.mindAndBody, life: life)
                    healthSection(life)
                    socialSection(life)
                    activitySection("Nightlife", Activity.nightlife, life: life)
                    activitySection("Leisure", Activity.leisure, life: life)
                    Section("More") {
                        NavigationLink {
                            CasinoView()
                        } label: {
                            ActionRow(emoji: "🎰", title: "Casino", subtitle: life.age >= 18 ? "Blackjack, roulette, slots & horses" : "Available at 18", enabled: life.age >= 18)
                        }
                        .disabled(life.age < 18)
                        if life.canTakeDrivingTest {
                            Button { store.run { $0.takeDrivingTest() } } label: {
                                ActionRow(emoji: "🚦", title: "Driving Test", subtitle: "Get your license")
                            }
                        }
                        NavigationLink {
                            EmigrateView()
                        } label: {
                            ActionRow(emoji: "✈️", title: "Emigrate", subtitle: life.age >= 18 ? "Move to a new country · $5,000" : "Available at 18", enabled: life.age >= 18)
                        }
                        .disabled(life.age < 18)
                    }
                    crimeSection(life)
                }

                if !life.criminalRecord.isEmpty {
                    Section("Criminal Record") {
                        ForEach(Array(life.criminalRecord.enumerated()), id: \.offset) { _, offense in
                            Text(offense)
                        }
                    }
                }
            }
            .foregroundStyle(.primary)
            .navigationTitle(life.inPrison ? "Prison" : "Activities")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .confirmationAction) {
                    Button("Done") { dismiss() }
                }
            }
        }
    }

    private func activitySection(_ title: String, _ activities: [Activity], life: Life) -> some View {
        Section(title) {
            ForEach(activities) { activity in
                let allowed = life.canDo(activity)
                Button { store.run { $0.perform(activity) } } label: {
                    ActionRow(
                        emoji: activity.emoji,
                        title: activity.title,
                        subtitle: allowed ? activity.subtitle : "Available at \(activity.minAge)",
                        enabled: allowed
                    )
                }
                .disabled(!allowed)
            }
        }
    }

    private func healthSection(_ life: Life) -> some View {
        Section {
            ForEach(Treatment.allCases) { treatment in
                let allowed = treatment != .therapist || life.age >= 10
                Button { store.run { $0.treat(with: treatment) } } label: {
                    ActionRow(emoji: treatment.emoji, title: treatment.title, subtitle: formatMoney(treatment.cost), enabled: allowed)
                }
                .disabled(!allowed)
            }
            if !life.addictions.isEmpty {
                Button { store.run { $0.goToRehab() } } label: {
                    ActionRow(emoji: "🏥", title: "Rehab", subtitle: "Beat your addictions · $15,000")
                }
            }
        } header: {
            Text("Health")
        } footer: {
            let problems = life.illnesses.map(\.name) + life.addictions.map(\.name)
            Text(problems.isEmpty ? "You're in good health." : "Conditions: " + problems.joined(separator: ", "))
        }
    }

    private func socialSection(_ life: Life) -> some View {
        Section {
            Button { store.run { $0.postOnSocialMedia() } } label: {
                ActionRow(
                    emoji: "📱",
                    title: "Post on Social Media",
                    subtitle: life.canPostOnSocialMedia ? "\(life.followers.formatted()) followers" : "Available at 13",
                    enabled: life.canPostOnSocialMedia
                )
            }
            .disabled(!life.canPostOnSocialMedia)
        } header: {
            Text("Social Media")
        }
    }

    private func crimeSection(_ life: Life) -> some View {
        Section {
            ForEach(Crime.allCases) { crime in
                let allowed = life.age >= crime.minAge
                Button { store.run { $0.commit(crime) } } label: {
                    ActionRow(
                        emoji: crime.emoji,
                        title: crime.title,
                        subtitle: allowed ? "Risky" : "Available at \(crime.minAge)",
                        enabled: allowed
                    )
                }
                .disabled(!allowed)
            }
        } header: {
            Text("Crime")
        } footer: {
            Text("Crime pays... until it doesn't. Adults who get caught go to prison.")
        }
    }
}

struct CasinoView: View {
    @EnvironmentObject private var store: GameStore
    @State private var bet = 1_000

    var body: some View {
        List {
            Section {
                LabeledContent("Bank Balance", value: formatMoney(store.life?.money ?? 0))
                Picker("Bet", selection: $bet) {
                    ForEach(CasinoGame.bets, id: \.self) { amount in
                        Text(formatMoney(amount)).tag(amount)
                    }
                }
            }
            Section("Games") {
                ForEach(CasinoGame.allCases) { game in
                    let (chance, payout) = game.odds
                    Button { store.run { $0.gamble(game, bet: bet) } } label: {
                        ActionRow(emoji: game.emoji, title: game.title, subtitle: "Pays \(payout)× · \(Int(chance * 100))% chance")
                    }
                    .foregroundStyle(.primary)
                    .disabled((store.life?.money ?? 0) < bet)
                }
            }
        }
        .navigationTitle("Casino")
    }
}

struct EmigrateView: View {
    @EnvironmentObject private var store: GameStore
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        List {
            ForEach(Array(Names.places.enumerated()), id: \.offset) { _, place in
                let isHome = store.life?.city == place.0
                Button {
                    store.run { $0.emigrate(to: place) }
                    dismiss()
                } label: {
                    HStack {
                        Text(place.0).font(.body.weight(.medium))
                        Spacer()
                        Text(isHome ? "You live here" : place.1)
                            .foregroundStyle(.secondary)
                    }
                }
                .foregroundStyle(.primary)
                .disabled(isHome)
            }
        }
        .navigationTitle("Emigrate")
    }
}
