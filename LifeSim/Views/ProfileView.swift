import SwiftUI

struct ProfileView: View {
    @EnvironmentObject private var store: GameStore
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        if let life = store.life {
            List {
                Section {
                    VStack(spacing: 6) {
                        Text(life.emoji).font(.system(size: 72))
                        Text(life.fullName).font(.title2.bold())
                        Text("\(life.age) years old · \(life.gender.label)")
                            .foregroundStyle(.secondary)
                    }
                    .frame(maxWidth: .infinity)
                }
                .listRowBackground(Color.clear)

                Section("Stats") {
                    StatsPanel(stats: life.stats)
                    if life.fame > 0 {
                        StatBar(label: "Fame", emoji: "⭐", value: life.fame)
                    }
                }

                Section("About Me") {
                    LabeledContent("Lives in", value: "\(life.city), \(life.country)")
                    LabeledContent("Generation", value: "\(life.generation)")
                    LabeledContent("Education", value: life.education.label)
                    LabeledContent("Occupation", value: life.job?.title ?? (life.isRetired ? "Retired" : (life.schoolName ?? "None")))
                    LabeledContent("Net Worth", value: formatMoney(life.netWorth))
                    LabeledContent("Driver's License", value: life.hasDriversLicense ? "Yes" : "No")
                    LabeledContent("Followers", value: life.followers.formatted())
                    LabeledContent("Partners", value: "\(life.count(.partners))")
                    LabeledContent("Children", value: "\(life.children.count)")
                }

                Section("Health") {
                    if life.illnesses.isEmpty && life.addictions.isEmpty {
                        Text("No health problems 💪").foregroundStyle(.secondary)
                    }
                    ForEach(life.illnesses) { illness in
                        Label(illness.name, systemImage: "cross.case.fill")
                    }
                    ForEach(life.addictions) { addiction in
                        Label(addiction.name, systemImage: "exclamationmark.triangle.fill")
                    }
                }

                if !life.criminalRecord.isEmpty || life.inPrison {
                    Section("Criminal Record") {
                        if life.inPrison {
                            LabeledContent("In prison", value: "\(life.prisonYearsLeft) years left")
                        }
                        ForEach(Array(life.criminalRecord.enumerated()), id: \.offset) { _, offense in
                            Text(offense)
                        }
                    }
                }
            }
            .navigationTitle("Profile")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .confirmationAction) {
                    Button("Done") { dismiss() }
                }
            }
        }
    }
}
