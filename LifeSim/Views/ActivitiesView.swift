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
                    Section("Mind & Body") {
                        ForEach([Activity.gym, .library, .meditate, .walk, .doctor]) { activity in
                            row(activity, life: life)
                        }
                    }
                    Section("Leisure") {
                        ForEach([Activity.party, .vacation, .plasticSurgery]) { activity in
                            row(activity, life: life)
                        }
                    }
                    Section("Gambling") {
                        ForEach([Activity.lottery, .casino]) { activity in
                            row(activity, life: life)
                        }
                    }
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

    private func row(_ activity: Activity, life: Life) -> some View {
        let allowed = life.canDo(activity)
        return Button { store.run { $0.perform(activity) } } label: {
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
