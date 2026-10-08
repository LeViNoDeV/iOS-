import SwiftUI

enum MainSheet: String, Identifiable {
    case occupation, assets, relationships, activities, profile
    var id: String { rawValue }
}

struct MainLifeView: View {
    @EnvironmentObject private var store: GameStore
    @State private var sheet: MainSheet?
    @State private var confirmingNewLife = false

    var body: some View {
        if let life = store.life {
            VStack(spacing: 0) {
                header(life)
                Divider()
                LifeLogView(log: life.log)
                Divider()
                bottomBar(life)
                StatsPanel(stats: life.stats)
                    .padding(.horizontal)
                    .padding(.vertical, 10)
                    .background(Color(.secondarySystemBackground))
            }
            .overlay {
                if let event = life.pendingEvents.first {
                    EventCard(event: event) { choice in
                        withAnimation { store.choose(choice, for: event) }
                    }
                }
            }
            .animation(.easeInOut(duration: 0.2), value: life.pendingEvents.first?.id)
            .sheet(item: $sheet) { sheet in
                NavigationStack {
                    switch sheet {
                    case .occupation: OccupationView()
                    case .assets: AssetsView()
                    case .relationships: RelationshipsView()
                    case .activities: ActivitiesView()
                    case .profile: ProfileView()
                    }
                }
                .environmentObject(store)
                .outcomeAlert($store.outcome)
            }
            .confirmationDialog("Start a new life?", isPresented: $confirmingNewLife, titleVisibility: .visible) {
                Button("Abandon this life", role: .destructive) { store.abandonLife() }
            } message: {
                Text("\(life.fullName) will be sent to the graveyard.")
            }
            .outcomeAlert(Binding(
                get: { sheet == nil ? store.outcome : nil },
                set: { store.outcome = $0 }
            ))
        }
    }

    private func header(_ life: Life) -> some View {
        HStack(spacing: 12) {
            Button { sheet = .profile } label: {
                HStack(spacing: 12) {
                    Text(life.emoji)
                        .font(.system(size: 44))
                        .frame(width: 60, height: 60)
                        .background(Color.lifeBlue.opacity(0.15), in: Circle())
                    VStack(alignment: .leading, spacing: 2) {
                        Text(life.fullName)
                            .font(.title3.bold())
                            .lineLimit(1)
                            .minimumScaleFactor(0.7)
                        Text(subtitle(life))
                            .font(.subheadline)
                            .foregroundStyle(.secondary)
                            .lineLimit(1)
                    }
                }
            }
            .foregroundStyle(.primary)
            Spacer()
            VStack(alignment: .trailing, spacing: 2) {
                Text(formatMoney(life.money))
                    .font(.headline.monospacedDigit())
                    .foregroundStyle(life.money < 0 ? .red : Color.lifeGreen)
                Text("Bank Balance")
                    .font(.caption2)
                    .foregroundStyle(.secondary)
            }
            Menu {
                Button { sheet = .profile } label: { Label("Profile", systemImage: "person.text.rectangle") }
                Button(role: .destructive) { confirmingNewLife = true } label: { Label("New Life", systemImage: "arrow.counterclockwise") }
            } label: {
                Image(systemName: "ellipsis.circle")
                    .font(.title2)
                    .foregroundStyle(Color.lifeBlue)
            }
        }
        .padding()
    }

    private func subtitle(_ life: Life) -> String {
        if life.inPrison { return "Inmate · \(life.prisonYearsLeft)y left" }
        if let job = life.job { return job.title }
        if let school = life.schoolName { return "Student · \(school)" }
        if life.isRetired { return "Retired" }
        return life.age < 5 ? "\(life.city), \(life.country)" : "Unemployed"
    }

    private func bottomBar(_ life: Life) -> some View {
        HStack(alignment: .center, spacing: 0) {
            barButton(life.inPrison ? "Prison" : "Career", systemImage: life.inPrison ? "lock.fill" : "briefcase.fill") {
                sheet = life.inPrison ? .activities : .occupation
            }
            barButton("Assets", systemImage: "house.fill") { sheet = .assets }

            Button {
                withAnimation { store.ageUp() }
            } label: {
                VStack(spacing: 0) {
                    Image(systemName: "plus")
                        .font(.system(size: 28, weight: .heavy))
                    Text("Age")
                        .font(.caption.bold())
                }
                .foregroundStyle(.white)
                .frame(width: 76, height: 76)
                .background(Color.lifeGreen, in: Circle())
                .shadow(color: .black.opacity(0.2), radius: 4, y: 2)
            }
            .padding(.horizontal, 6)
            .offset(y: -12)
            .accessibilityLabel("Age up one year")

            barButton("People", systemImage: "heart.fill") { sheet = .relationships }
            barButton("Activities", systemImage: "figure.run") { sheet = .activities }
        }
        .padding(.top, 12)
        .padding(.horizontal, 8)
    }

    private func barButton(_ title: String, systemImage: String, action: @escaping () -> Void) -> some View {
        Button(action: action) {
            VStack(spacing: 4) {
                Image(systemName: systemImage)
                    .font(.title3)
                Text(title)
                    .font(.caption2.weight(.semibold))
            }
            .frame(maxWidth: .infinity)
            .foregroundStyle(Color.lifeBlue)
        }
    }
}

struct LifeLogView: View {
    let log: [YearLog]

    var body: some View {
        ScrollViewReader { proxy in
            ScrollView {
                LazyVStack(alignment: .leading, spacing: 14) {
                    ForEach(log) { year in
                        VStack(alignment: .leading, spacing: 4) {
                            Text("Age: \(year.age) year\(year.age == 1 ? "" : "s")")
                                .font(.subheadline.bold())
                                .foregroundStyle(Color.lifeBlue)
                            if year.entries.isEmpty {
                                Text("Nothing much happened.")
                                    .font(.callout)
                                    .foregroundStyle(.secondary)
                            }
                            ForEach(Array(year.entries.enumerated()), id: \.offset) { _, entry in
                                Text(entry)
                                    .font(.callout)
                                    .fixedSize(horizontal: false, vertical: true)
                            }
                        }
                        .id(year.age)
                    }
                    Color.clear.frame(height: 1).id("bottom")
                }
                .padding()
            }
            .onChange(of: log) {
                withAnimation { proxy.scrollTo("bottom", anchor: .bottom) }
            }
            .onAppear { proxy.scrollTo("bottom", anchor: .bottom) }
        }
    }
}
