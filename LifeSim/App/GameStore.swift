import SwiftUI

/// Owns the current life, persists it, and exposes actions to the UI.
@MainActor
final class GameStore: ObservableObject {
    @Published private(set) var life: Life?
    @Published private(set) var graveyard: [LifeSummary] = []
    @Published var outcome: Outcome?

    private struct SaveData: Codable {
        var life: Life?
        var graveyard: [LifeSummary]
    }

    private let saveURL: URL = {
        let dir = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask)[0]
        return dir.appendingPathComponent("lifesim-save.json")
    }()

    init() {
        load()
    }

    // MARK: Lifecycle

    func startNewLife(firstName: String = "", lastName: String = "", gender: Gender? = nil) {
        life = Life.random(firstName: firstName, lastName: lastName, gender: gender)
        outcome = nil
        save()
    }

    /// Continues the family line as one of the dead player's children.
    func continueAs(_ child: Relationship) {
        guard let current = life, !current.isAlive else { return }
        life = current.continueAs(child)
        outcome = nil
        save()
    }

    /// Abandons the current life (it goes to the graveyard) and returns to the start screen.
    func abandonLife() {
        guard var current = life, current.isAlive else { return }
        current.causeOfDeath = "unknown causes"
        graveyard.insert(current.summary(), at: 0)
        endLife()
    }

    func endLife() {
        life = nil
        outcome = nil
        save()
    }

    func ageUp() {
        guard var current = life, current.isAlive, current.pendingEvents.isEmpty else { return }
        current.ageUp()
        commit(current)
    }

    func choose(_ option: Int, for event: PendingEvent) {
        guard var current = life else { return }
        _ = current.resolve(event, choice: option)
        commit(current)
    }

    /// Runs an action against the current life and shows its outcome.
    func run(_ action: (inout Life) -> Outcome) {
        guard var current = life, current.isAlive else { return }
        let result = action(&current)
        commit(current)
        outcome = result
    }

    private func commit(_ updated: Life) {
        let justDied = (life?.isAlive ?? false) && !updated.isAlive
        life = updated
        if justDied {
            graveyard.insert(updated.summary(), at: 0)
        }
        save()
    }

    // MARK: Persistence

    private func save() {
        let data = SaveData(life: life, graveyard: graveyard)
        do {
            let encoded = try JSONEncoder().encode(data)
            try encoded.write(to: saveURL, options: .atomic)
        } catch {
            print("Failed to save game: \(error)")
        }
    }

    private func load() {
        guard let data = try? Data(contentsOf: saveURL),
              let decoded = try? JSONDecoder().decode(SaveData.self, from: data) else { return }
        life = decoded.life
        graveyard = decoded.graveyard
    }
}
