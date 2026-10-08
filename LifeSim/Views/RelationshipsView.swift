import SwiftUI

struct RelationshipsView: View {
    @EnvironmentObject private var store: GameStore
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        if let life = store.life {
            List {
                if !life.inPrison {
                    Section {
                        if life.canFindDate {
                            Button { store.run { $0.findDate() } } label: {
                                ActionRow(emoji: "❤️", title: "Find a Date", subtitle: "Look for love")
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
            .navigationTitle("Relationships")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .confirmationAction) {
                    Button("Done") { dismiss() }
                }
            }
        }
    }

    @ViewBuilder
    private func group(_ title: String, _ people: [Relationship]) -> some View {
        if !people.isEmpty {
            Section(title) {
                ForEach(people) { person in
                    NavigationLink {
                        RelationshipDetailView(personID: person.id)
                    } label: {
                        PersonRow(person: person)
                    }
                }
            }
        }
    }
}

struct PersonRow: View {
    let person: Relationship

    var body: some View {
        HStack(spacing: 12) {
            Text(person.emoji)
                .font(.title)
                .frame(width: 44)
            VStack(alignment: .leading, spacing: 4) {
                Text(person.fullName)
                    .font(.body.weight(.medium))
                Text(person.isAlive ? "\(person.title) · Age \(person.age)" : "\(person.title) · Deceased")
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

                let actions = life.actions(for: person)
                if !actions.isEmpty {
                    Section("Interact") {
                        ForEach(actions) { action in
                            Button {
                                store.run { $0.perform(action, with: personID) }
                            } label: {
                                Text(action.title)
                                    .foregroundStyle(action == .argue || action == .breakUp ? Color.red : Color.primary)
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
