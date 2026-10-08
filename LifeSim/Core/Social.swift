import Foundation

// MARK: - Personality traits

enum Trait: String, Codable, CaseIterable {
    case kind, generous, funny, ambitious, jealous, lazy, toxic

    var name: String { rawValue.capitalized }

    var emoji: String {
        switch self {
        case .kind: return "💗"
        case .generous: return "🎁"
        case .funny: return "😂"
        case .ambitious: return "🚀"
        case .jealous: return "😒"
        case .lazy: return "🛋️"
        case .toxic: return "☠️"
        }
    }

    var blurb: String {
        switch self {
        case .kind: return "Looks after you when you're sick or down."
        case .generous: return "Happy to help out with money."
        case .funny: return "Always cheers you up."
        case .ambitious: return "Driven, and earns more."
        case .jealous: return "Hates it when you spend time with others."
        case .lazy: return "Earns less and doesn't pull their weight."
        case .toxic: return "Draining to be around. The bond decays faster."
        }
    }

    static func random() -> Trait? {
        roll(0.75) ? allCases.randomElement() : nil
    }
}

/// Jobs that other people in your life can have: (title, salary range).
let npcOccupations: [(String, ClosedRange<Int>)] = [
    ("Teacher", 40_000...65_000), ("Nurse", 55_000...90_000), ("Electrician", 45_000...80_000),
    ("Accountant", 55_000...95_000), ("Software Engineer", 90_000...180_000), ("Chef", 30_000...70_000),
    ("Police Officer", 50_000...90_000), ("Lawyer", 90_000...250_000), ("Doctor", 180_000...350_000),
    ("Barista", 22_000...30_000), ("Mechanic", 38_000...65_000), ("Real Estate Agent", 30_000...150_000),
    ("Graphic Designer", 40_000...85_000), ("Pharmacist", 110_000...150_000), ("Plumber", 45_000...90_000),
    ("Cashier", 20_000...28_000), ("Pilot", 100_000...220_000), ("Artist", 10_000...60_000),
]

// MARK: - Relationship extras

extension Relationship {
    var isPet: Bool { kind == .pet }

    /// Gives an adult a job (or none) based on their trait.
    mutating func assignOccupation() {
        guard age >= 18, species == nil else { return }
        if age >= 67 {
            occupation = "Retired"
            salary = 0
            return
        }
        if roll(trait == .lazy ? 0.4 : 0.1) {
            occupation = "Unemployed"
            salary = 0
            return
        }
        let job = npcOccupations.randomElement()!
        var pay = Int.random(in: job.1)
        if trait == .ambitious { pay = Int(Double(pay) * 1.4) }
        if trait == .lazy { pay = Int(Double(pay) * 0.7) }
        occupation = job.0
        salary = pay / 100 * 100
    }

    /// A short label describing where the relationship stands.
    var status: String? {
        guard isAlive, !isPet else { return nil }
        switch bond {
        case 90...: return kind == .friend ? "Best Friend" : "Inseparable"
        case 70..<90: return "Close"
        case 30..<70: return nil
        case 15..<30: return "Strained"
        default: return "Estranged"
        }
    }

    func yearsSinceContact(playerAge: Int) -> Int? {
        guard let last = lastContact else { return nil }
        return playerAge - last
    }
}

// MARK: - Life + social

extension Life {
    /// How supported you feel by the people around you (0–100).
    var socialSupport: Int {
        var total = 0.0
        var weight = 0.0
        for person in relationships where person.isAlive {
            let w: Double
            switch person.kind {
            case .spouse, .fiance, .partner: w = 3
            case .mother, .father: w = age < 25 ? 2 : 1
            case .child: w = 1.5
            case .friend: w = 1
            case .sibling: w = 0.75
            case .pet: w = 0.5
            }
            total += Double(person.bond) * w
            weight += w
        }
        guard weight > 0 else { return 0 }
        // Few people around you caps how supported you can feel.
        let breadth = min(1.0, weight / 4)
        return Int(total / weight * breadth)
    }

    var isLonely: Bool {
        age >= 16 && romanticPartner == nil
            && !relationships.contains { $0.isAlive && $0.kind == .friend && $0.bond >= 50 }
    }

    var bestFriend: Relationship? {
        relationships.filter { $0.isAlive && $0.kind == .friend && $0.bond >= 80 }.max { $0.bond < $1.bond }
    }

    var spouse: Relationship? { relationships.first { $0.isAlive && $0.kind == .spouse } }

    /// What a spouse adds to the household each year.
    var spouseContribution: Int {
        guard let spouse = spouse, spouse.bond >= 40 else { return 0 }
        let share = spouse.trait == .lazy ? 0.15 : 0.35
        return Int(Double(spouse.salary) * share)
    }

    /// Yearly cost of raising children under 18 (split with a spouse).
    var childExpenses: Int {
        let kids = children.filter { $0.isAlive && $0.age < 18 }.count
        let perChild = spouse == nil ? 8_000 : 5_000
        return kids * perChild
    }

    var livesWithParents: Bool {
        age < 25 && relationships.contains { $0.kind.isParent && $0.isAlive && $0.bond >= 40 }
    }

    /// Marks that you interacted with someone this year.
    mutating func touch(_ id: UUID) {
        guard let index = relationships.firstIndex(where: { $0.id == id }) else { return }
        relationships[index].lastContact = age
    }

    /// Fraction of a parent's estate you get, depending on how close you were.
    func inheritanceShare(from parent: Relationship) -> Double {
        switch parent.bond {
        case 60...: return 1.0
        case 30..<60: return 0.5
        default: return 0
        }
    }

    /// Yearly effects of the people in your life. Runs after relationships age.
    mutating func progressSocial() {
        // Feeling supported (or not).
        let support = socialSupport
        adjust(happiness: ((support - 50) / 10).clamped(to: -5...5))
        if isLonely && roll(0.4) {
            adjust(happiness: -4)
            record("😔 I've been feeling lonely. I wish I had someone to talk to.")
        }

        // Household money.
        if spouseContribution > 0 {
            money += spouseContribution
        }
        if childExpenses > 0 {
            money -= childExpenses
        }

        // Parents.
        let parents = relationships.filter { $0.kind.isParent && $0.isAlive }
        if (6...17).contains(age), let parent = parents.filter({ $0.bond >= 60 && $0.money > 2_000 }).randomElement(), roll(0.6) {
            let allowance = Int.random(in: 3...12) * age * (parent.trait == .generous ? 2 : 1)
            money += allowance
            updateRelationship(parent.id) { $0.money -= allowance }
            record("💵 My \(parent.title.lowercased()) gave me \(formatMoney(allowance)) in allowance.")
        }
        if age == 18 && !parents.isEmpty && parents.allSatisfy({ $0.bond < 35 }) && !inPrison {
            record("🧳 My parents kicked me out of the house. I'm on my own now.")
            adjust(happiness: -12)
        }

        // People who look after you.
        for person in relationships where person.isAlive && person.trait == .kind && person.bond >= 60 {
            if stats.health < 50 || !illnesses.isEmpty, roll(0.4) {
                adjust(happiness: 4, health: 4)
                record("💗 \(person.firstName) took care of me while I was unwell.")
                break
            }
        }
        for person in relationships where person.isAlive && person.trait == .toxic && person.bond >= 20 && !person.isPet {
            if roll(0.3) {
                adjust(happiness: -5)
                record("☠️ \(person.firstName) has been making my life miserable.")
                break
            }
        }

        // Adult children.
        let adultKids = children.filter { $0.isAlive && $0.age >= 18 }
        if age >= 65 {
            let caring = adultKids.filter { $0.bond >= 65 }
            if !caring.isEmpty {
                adjust(happiness: 3 * min(3, caring.count), health: 2 * min(3, caring.count))
                if roll(0.4), let kid = caring.randomElement() {
                    let gift = max(500, kid.salary / 20)
                    money += gift
                    record("👪 \(kid.firstName) visited and helped me out with \(formatMoney(gift)).")
                }
            } else if !adultKids.isEmpty && roll(0.5) {
                adjust(happiness: -6)
                record("📭 My kids never call or visit anymore.")
            }
        }

        // Romance gets deeper (or doesn't).
        for index in relationships.indices where relationships[index].isAlive && relationships[index].kind.isRomantic {
            relationships[index].yearsTogether += 1
        }

        // Teen children and grown-up milestones.
        for index in relationships.indices where relationships[index].isAlive && relationships[index].kind == .child {
            let kid = relationships[index]
            if kid.age == 18 {
                if kid.bond >= 50 && roll(0.6) {
                    record("🎓 My \(kid.title.lowercased()) \(kid.firstName) went off to college. I'm so proud.")
                    adjust(happiness: 5)
                } else {
                    record("My \(kid.title.lowercased()) \(kid.firstName) turned 18 and moved out.")
                }
            }
            if kid.age == 22 && kid.occupation == nil {
                relationships[index].assignOccupation()
                if let job = relationships[index].occupation, job != "Unemployed" {
                    record("💼 My \(kid.title.lowercased()) \(kid.firstName) got a job as a \(job.lowercased()).")
                }
            }
        }
    }
}
