import SwiftUI

struct NewLifeView: View {
    @EnvironmentObject private var store: GameStore
    @State private var firstName = ""
    @State private var lastName = ""
    @State private var gender: Gender = .male

    var body: some View {
        NavigationStack {
            Form {
                Section {
                    VStack(spacing: 8) {
                        Text("🌱").font(.system(size: 64))
                        Text("LifeSim").font(.largeTitle.bold())
                        Text("Live a whole life, one year at a time.")
                            .font(.subheadline)
                            .foregroundStyle(.secondary)
                    }
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 8)
                }
                .listRowBackground(Color.clear)

                Section {
                    Button {
                        store.startNewLife()
                    } label: {
                        Label("Random Life", systemImage: "dice.fill")
                            .font(.headline)
                            .frame(maxWidth: .infinity)
                    }
                    .buttonStyle(.borderedProminent)
                    .tint(Color.lifeGreen)
                    .listRowInsets(EdgeInsets())
                }

                Section("Custom Life") {
                    TextField("First name (optional)", text: $firstName)
                        .textInputAutocapitalization(.words)
                    TextField("Last name (optional)", text: $lastName)
                        .textInputAutocapitalization(.words)
                    Picker("Gender", selection: $gender) {
                        ForEach(Gender.allCases) { Text($0.label).tag($0) }
                    }
                    .pickerStyle(.segmented)
                    Button("Start Custom Life") {
                        store.startNewLife(
                            firstName: firstName.trimmingCharacters(in: .whitespaces),
                            lastName: lastName.trimmingCharacters(in: .whitespaces),
                            gender: gender
                        )
                    }
                }

                if !store.graveyard.isEmpty {
                    Section("Graveyard") {
                        ForEach(store.graveyard) { past in
                            HStack {
                                Text("🪦")
                                VStack(alignment: .leading) {
                                    Text(past.name).font(.body.weight(.medium))
                                    Text("Died at \(past.ageAtDeath) from \(past.causeOfDeath)")
                                        .font(.caption)
                                        .foregroundStyle(.secondary)
                                }
                                Spacer()
                                Text(formatMoney(past.netWorth))
                                    .font(.caption.monospacedDigit())
                                    .foregroundStyle(.secondary)
                            }
                        }
                    }
                }
            }
            .navigationBarTitleDisplayMode(.inline)
        }
    }
}

struct DeathView: View {
    @EnvironmentObject private var store: GameStore
    let life: Life

    var body: some View {
        ScrollView {
            VStack(spacing: 18) {
                Text("🪦").font(.system(size: 80)).padding(.top, 40)
                Text("Rest in Peace").font(.largeTitle.bold())
                Text(life.fullName).font(.title2)
                Text("Died at age \(life.age) from \(life.causeOfDeath ?? "unknown causes").")
                    .foregroundStyle(.secondary)
                    .multilineTextAlignment(.center)

                VStack(spacing: 10) {
                    summaryRow("Net Worth", formatMoney(life.netWorth))
                    summaryRow("Education", life.education.label)
                    summaryRow("Last Job", life.job?.title ?? (life.isRetired ? "Retired" : "None"))
                    summaryRow("Children", "\(life.relationships.filter { $0.kind == .child }.count)")
                    summaryRow("Spouse", life.relationships.first { $0.kind == .spouse && $0.isAlive }?.fullName ?? "None")
                    summaryRow("Criminal Record", life.criminalRecord.isEmpty ? "Clean" : "\(life.criminalRecord.count) offense(s)")
                    summaryRow("Karma", karmaLabel(life.karma))
                }
                .padding()
                .background(Color(.secondarySystemBackground), in: RoundedRectangle(cornerRadius: 16))
                .padding(.horizontal)

                Button {
                    store.endLife()
                } label: {
                    Text("Start a New Life")
                        .font(.headline)
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 6)
                }
                .buttonStyle(.borderedProminent)
                .tint(Color.lifeGreen)
                .padding(.horizontal)
            }
            .padding(.bottom, 40)
        }
    }

    private func summaryRow(_ title: String, _ value: String) -> some View {
        HStack {
            Text(title).foregroundStyle(.secondary)
            Spacer()
            Text(value).fontWeight(.medium)
        }
    }

    private func karmaLabel(_ karma: Int) -> String {
        switch karma {
        case ..<20: return "Villain 😈"
        case ..<45: return "Questionable"
        case ..<70: return "Decent"
        default: return "Saint 😇"
        }
    }
}
