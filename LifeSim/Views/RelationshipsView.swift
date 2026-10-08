import SwiftUI

struct RelationshipsView: View {
    @EnvironmentObject private var store: GameStore
    @Environment(\.dismiss) private var dismiss
    @State private var choosingDateGender = false
    @State private var choosingPet = false

    var body: some View {
        if let life = store.life {
            List {
                Section {
                    StatBar(label: "Support", emoji: "🫂", value: life.socialSupport)
                } footer: {
                    Text(supportFooter(life))
                }

                if !life.inPrison {
                    Section {
                        if life.canFindDate {
                            Button { choosingDateGender = true } label: {
                                ActionRow(emoji: "❤️", title: "Find a Date", subtitle: "Look for love")
                            }
                        }
                        if life.canHookUp {
                            Button { store.run { $0.hookUp() } } label: {
                                ActionRow(emoji: "🔥", title: "Hook Up", subtitle: life.romanticPartner == nil ? "No strings attached" : "Cheat on your partner...")
                            }
                        }
                        if life.age >= 8 {
                            Button { choosingPet = true } label: {
                                ActionRow(emoji: "🐾", title: "Pet Shelter", subtitle: "Adopt a pet · $200")
                            }
                        }
                        if life.canAdoptChild {
                            Button { store.run { $0.adoptChild() } } label: {
                                ActionRow(emoji: "🍼", title: "Adopt a Child", subtitle: "Agency fees · $10,000")
                            }
                        }
                        if life.age >= 5 {
                            Button { store.run { $0.makeFriend() } } label: {
                                ActionRow(emoji: "🤝", title: "Make a Friend")
                            }
                        }
                    }
                }

                group("Family", life.relationships.filter { $0.kind.isParent || $0.kind == .sibling })
                group("Love", life.relationships.filter { $0.kind.isRomantic })
                group("Children", life.relationships.filter { $0.kind == .child })
                group("Friends", life.relationships.filter { $0.kind == .friend })
                group("Pets", life.relationships.filter { $0.kind == .pet })
            }
            .confirmationDialog("Who are you interested in?", isPresented: $choosingDateGender, titleVisibility: .visible) {
                Button("Men") { store.run { $0.findDate(gender: .male) } }
                Button("Women") { store.run { $0.findDate(gender: .female) } }
            }
            .confirmationDialog("Adopt a pet", isPresented: $choosingPet, titleVisibility: .visible) {
                ForEach(Names.petSpecies, id: \.self) { species in
                    Button("\(petEmoji[species] ?? "🐾") \(species)") { store.run { $0.adoptPet(species) } }
                }
            }
            .navigationTitle("Relationships")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .confirmationAction) {
                    Button("Done") { dismiss() }
                }
            }
        }
    }

    private func supportFooter(_ life: Life) -> String {
        if life.isLonely { return "You're lonely. Make friends or find a partner — loneliness drags your happiness down every year." }
        if life.socialSupport >= 70 { return "The people in your life have your back. Strong relationships boost your happiness every year." }
        return "Spend time with people to keep bonds strong. Relationships you ignore for 2+ years fade."
    }

    @ViewBuilder
    private func group(_ title: String, _ people: [Relationship]) -> some View {
        if !people.isEmpty {
            Section(title) {
                ForEach(people) { person in
                    NavigationLink {
                        RelationshipDetailView(personID: person.id)
                    } label: {
                        PersonRow(person: person, neglected: (person.yearsSinceContact(playerAge: store.life?.age ?? 0) ?? 0) >= 2)
                    }
                }
            }
        }
    }
}

struct PersonRow: View {
    let person: Relationship
    var neglected = false

    var body: some View {
        HStack(spacing: 12) {
            Text(person.emoji)
                .font(.title)
                .frame(width: 44)
            VStack(alignment: .leading, spacing: 4) {
                Text(person.fullName)
                    .font(.body.weight(.medium))
                Text(subtitle)
                    .font(.caption)
                    .foregroundStyle(.secondary)
                if person.isAlive {
                    ProgressView(value: Double(person.bond), total: 100)
                        .tint(Color.forStat(person.bond))
                }
            }
        }
        .padding(.vertical, 2)
        .opacity(person.isAlive ? 1 : 0.5)
    }

    private var subtitle: String {
        guard person.isAlive else { return "\(person.title) · Deceased" }
        var parts = ["\(person.title) · Age \(person.age)"]
        if let status = person.status { parts.append(status) }
        if let trait = person.trait { parts.append(trait.emoji) }
        if neglected { parts.append("💤 Neglected") }
        return parts.joined(separator: " · ")
    }
}

struct RelationshipDetailView: View {
    @EnvironmentObject private var store: GameStore
    let personID: UUID

    var body: some View {
        if let life = store.life, let person = life.relationships.first(where: { $0.id == personID }) {
            List {
                Section {
                    VStack(spacing: 6) {
                        Text(person.emoji).font(.system(size: 64))
                        Text(person.fullName).font(.title2.bold())
                        Text("\(person.title) · Age \(person.age)")
                            .foregroundStyle(.secondary)
                    }
                    .frame(maxWidth: .infinity)
                    if person.isAlive {
                        StatBar(label: "Relationship", emoji: "💞", value: person.bond)
                        if person.species == nil {
                            StatBar(label: "Looks", emoji: "✨", value: person.looks)
                        }
                    }
                }

                if person.isAlive && !person.isPet {
                    Section("About \(person.firstName)") {
                        if let status = person.status {
                            LabeledContent("Status", value: status)
                        }
                        if let trait = person.trait {
                            VStack(alignment: .leading, spacing: 2) {
                                Text("\(trait.emoji) \(trait.name)").font(.body.weight(.medium))
                                Text(trait.blurb).font(.caption).foregroundStyle(.secondary)
                            }
                        }
                        if let occupation = person.occupation {
                            LabeledContent("Occupation", value: person.salary > 0 ? "\(occupation) · \(formatMoney(person.salary))/yr" : occupation)
                        }
                        if person.kind.isRomantic && person.yearsTogether > 0 {
                            LabeledContent("Together", value: "\(person.yearsTogether) year\(person.yearsTogether == 1 ? "" : "s")")
                        }
                        if let years = person.yearsSinceContact(playerAge: life.age) {
                            LabeledContent("Last talked", value: years <= 0 ? "This year" : "\(years) year\(years == 1 ? "" : "s") ago")
                                .foregroundStyle(years >= 2 ? Color.orange : Color.primary)
                        }
                    }
                }

                let actions = life.actions(for: person)
                if !actions.isEmpty {
                    Section("Interact") {
                        ForEach(actions) { action in
                            Button {
                                store.run { $0.perform(action, with: personID) }
                            } label: {
                                Text(action.title)
                                    .foregroundStyle(action.isHostile ? Color.red : Color.primary)
                            }
                        }
                    }
                } else if life.inPrison {
                    Section {
                        Text("You can't visit anyone while you're in prison.")
                            .foregroundStyle(.secondary)
                    }
                }
            }
            .navigationTitle(person.firstName)
            .navigationBarTitleDisplayMode(.inline)
        } else {
            ContentUnavailableView("No longer in your life", systemImage: "person.slash")
        }
    }
}
