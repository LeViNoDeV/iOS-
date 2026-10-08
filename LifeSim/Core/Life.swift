import Foundation

/// The full state of one simulated life. Pure game logic — no UI code.
struct Life: Codable, Identifiable {
    var id = UUID()
    var firstName: String
    var lastName: String
    var gender: Gender
    var city: String
    var country: String
    var age = 0
    var stats: Stats
    var money = 0
    var karma = 50

    var isAlive = true
    var causeOfDeath: String?

    // Education
    var education: EducationLevel = .none
    var major: String?
    var graduateDegrees: [GraduateField] = []
    var schoolGrades = 50
    var droppedOut = false
    var enrollment: Enrollment?
    var studentLoans = 0

    // Career
    var job: Job?
    var isRetired = false
    var pension = 0

    // People & things
    var relationships: [Relationship] = []
    var assets: [Asset] = []

    // Crime
    var prisonYearsLeft = 0
    var criminalRecord: [String] = []

    // Timeline
    var log: [YearLog] = []
    var pendingEvents: [PendingEvent] = []

    var fullName: String { "\(firstName) \(lastName)" }
    var emoji: String { isAlive ? avatarEmoji(age: age, gender: gender) : "🪦" }
    var inPrison: Bool { prisonYearsLeft > 0 }
    var inGradeSchool: Bool { (5...17).contains(age) && !droppedOut }
    var netWorth: Int { money + assets.reduce(0) { $0 + $1.value } - studentLoans }
    var livingRelatives: [Relationship] { relationships.filter { $0.isAlive } }
    var romanticPartner: Relationship? { relationships.first { $0.isAlive && $0.kind.isRomantic } }

    var schoolName: String? {
        if let enrollment = enrollment { return enrollment.kind.name }
        guard inGradeSchool else { return nil }
        return age < 12 ? "Elementary School" : "High School"
    }

    // MARK: - Creation

    static func random(firstName: String? = nil, lastName: String? = nil, gender: Gender? = nil) -> Life {
        let g = gender ?? Gender.allCases.randomElement()!
        let last = (lastName?.isEmpty == false ? lastName! : Names.randomLast())
        let first = (firstName?.isEmpty == false ? firstName! : Names.first(for: g))
        let place = Names.places.randomElement()!

        var life = Life(firstName: first, lastName: last, gender: g, city: place.0, country: place.1, stats: .random())

        let familyWealth = Int.random(in: 5_000...400_000)
        var mother = Names.person(kind: .mother, age: .random(in: 19...42), gender: .female, lastName: last, bond: .random(in: 60...100))
        var father = Names.person(kind: .father, age: .random(in: 20...48), gender: .male, lastName: last, bond: .random(in: 50...100))
        mother.money = familyWealth / 2
        father.money = familyWealth / 2
        life.relationships = [mother, father]

        let siblingCount = [0, 0, 1, 1, 1, 2, 3].randomElement()!
        for _ in 0..<siblingCount {
            let siblingAge = Int.random(in: 1...min(15, max(1, mother.age - 18)))
            var sibling = Names.person(kind: .sibling, age: siblingAge, lastName: last)
            sibling.money = 0
            life.relationships.append(sibling)
        }

        var intro = "I was born a \(g.label.lowercased()) in \(place.0), \(place.1)."
        intro += " My mother is \(mother.fullName) (\(mother.age)) and my father is \(father.fullName) (\(father.age))."
        if siblingCount > 0 {
            let names = life.relationships.filter { $0.kind == .sibling }.map { "\($0.title.lowercased()) \($0.firstName)" }
            intro += " I have \(names.count == 1 ? "a" : "\(names.count) siblings:") \(names.joined(separator: ", "))."
        }
        life.log = [YearLog(age: 0, entries: [intro])]
        return life
    }

    // MARK: - Logging & stat helpers

    mutating func record(_ text: String) {
        if log.last?.age == age {
            log[log.count - 1].entries.append(text)
        } else {
            log.append(YearLog(age: age, entries: [text]))
        }
    }

    mutating func adjust(happiness: Int = 0, health: Int = 0, smarts: Int = 0, looks: Int = 0) {
        stats.happiness += happiness
        stats.health += health
        stats.smarts += smarts
        stats.looks += looks
        stats.clamp()
    }

    mutating func updateRelationship(_ id: UUID, _ change: (inout Relationship) -> Void) {
        guard let index = relationships.firstIndex(where: { $0.id == id }) else { return }
        change(&relationships[index])
        relationships[index].bond = relationships[index].bond.clamped(to: 0...100)
    }

    // MARK: - Age up

    mutating func ageUp() {
        guard isAlive else { return }
        age += 1
        log.append(YearLog(age: age, entries: []))

        ageStats()
        progressSchool()
        progressPrison()
        progressCareer()
        progressFinances()
        progressAssets()
        progressRelationships()
        if !inPrison { RandomEvents.generate(for: &self) }
        checkForDeath()
    }

    private mutating func ageStats() {
        var healthChange = Int.random(in: -2...2)
        if age > 45 { healthChange -= Int.random(in: 0...3) }
        if age > 70 { healthChange -= Int.random(in: 1...4) }
        var looksChange = Int.random(in: -2...2)
        if age > 35 { looksChange -= Int.random(in: 0...2) }
        if (13...16).contains(age) { looksChange += Int.random(in: -6...6) }
        var smartsChange = 0
        if age < 25 { smartsChange += Int.random(in: 0...2) }
        if age > 75 { smartsChange -= Int.random(in: 0...2) }
        adjust(happiness: .random(in: -4...3), health: healthChange, smarts: smartsChange, looks: looksChange)
        if stats.happiness < 15 { record("I've been feeling really down lately.") }
    }

    private mutating func progressSchool() {
        if age == 5 && !droppedOut { record("I started elementary school.") }
        if age == 12 && !droppedOut { record("I started high school.") }
        if inGradeSchool {
            schoolGrades = (schoolGrades + (stats.smarts - 50) / 10 + .random(in: -8...8)).clamped(to: 0...100)
        }
        if age == 18 && !droppedOut && !inPrison {
            education = max(education, .highSchool)
            record("I graduated from high school with a \(gradeLetter(schoolGrades)) average.")
            adjust(happiness: 8)
        }

        guard var current = enrollment else { return }
        current.yearsLeft -= 1
        current.grades = (current.grades + (stats.smarts - 50) / 8 + .random(in: -6...6)).clamped(to: 0...100)
        adjust(smarts: .random(in: 1...4))
        if current.yearsLeft > 0 {
            enrollment = current
            return
        }
        enrollment = nil
        switch current.kind {
        case .university(let major):
            education = max(education, .bachelor)
            self.major = major
            record("🎓 I graduated from university with a degree in \(major)!")
        case .graduate(let field):
            education = .graduate
            if !graduateDegrees.contains(field) { graduateDegrees.append(field) }
            record("🎓 I graduated from \(field.schoolName) and earned my \(field.degreeName)!")
        }
        adjust(happiness: 15)
    }

    private mutating func progressPrison() {
        guard inPrison else { return }
        prisonYearsLeft -= 1
        adjust(happiness: -6, health: -2)
        if prisonYearsLeft == 0 {
            record("🔓 I was released from prison.")
            adjust(happiness: 20)
        } else {
            record("I spent another year behind bars. \(prisonYearsLeft) year\(prisonYearsLeft == 1 ? "" : "s") left.")
        }
    }

    private mutating func progressCareer() {
        if isRetired {
            money += pension
            return
        }
        guard var current = job else { return }
        current.years += 1
        current.performance = (current.performance + .random(in: -10...8) + (stats.smarts - 50) / 15).clamped(to: 0...100)
        let net = Int(Double(current.salary) * 0.75)
        money += net
        let loanPayment = min(studentLoans, Int(Double(current.salary) * 0.1))
        if loanPayment > 0 {
            studentLoans -= loanPayment
            money -= loanPayment
            if studentLoans == 0 { record("I paid off my student loans!") }
        }

        if current.performance < 15 && roll(0.5) {
            job = nil
            record("❌ I was fired from my job as a \(current.title) at \(current.company).")
            adjust(happiness: -15)
            return
        }
        if current.performance > 70 && current.years >= 2 && roll(0.35) {
            let raise = Int(Double(current.salary) * Double.random(in: 0.08...0.2))
            current.salary += raise
            if !current.promoted, let next = jobCatalog.first(where: { $0.id == current.templateID })?.nextTitle, roll(0.5) {
                current.title = next
                current.promoted = true
                current.salary += raise
                record("📈 I was promoted to \(next)! My salary is now \(formatMoney(current.salary)).")
            } else {
                record("📈 I got a raise! My salary is now \(formatMoney(current.salary)).")
            }
            adjust(happiness: 8)
        }
        job = current
    }

    private mutating func progressFinances() {
        for asset in assets {
            let upkeep = asset.kind == .house ? asset.value / 100 : asset.value / 25
            money -= upkeep
        }
        if age >= 18 && enrollment == nil && !inPrison && job == nil && !isRetired && assets.isEmpty {
            // Basic living costs when not supported by anyone.
            if relationships.contains(where: { $0.kind.isParent && $0.isAlive }) && age < 25 {
                // Still living with mom and dad.
            } else {
                money -= 6_000
            }
        }
        if money < -50_000 && roll(0.3) {
            record("Debt collectors keep calling me about my \(formatMoney(money)) balance.")
            adjust(happiness: -8)
        }
    }

    private mutating func progressAssets() {
        for index in assets.indices {
            assets[index].yearsOwned += 1
            switch assets[index].kind {
            case .house:
                assets[index].value = Int(Double(assets[index].value) * Double.random(in: 0.97...1.08))
            case .car:
                assets[index].value = Int(Double(assets[index].value) * Double.random(in: 0.82...0.92))
            }
        }
    }

    private mutating func progressRelationships() {
        for index in relationships.indices where relationships[index].isAlive {
            relationships[index].age += 1
            let person = relationships[index]
            var drift = Int.random(in: -4...1)
            if person.kind == .pet { drift = Int.random(in: -1...2) }
            relationships[index].bond = (person.bond + drift).clamped(to: 0...100)

            if dies(age: person.age, isPet: person.kind == .pet) {
                relationships[index].isAlive = false
                let verb = person.kind == .pet ? "passed away" : "died"
                record("🕊️ My \(person.title.lowercased()) \(person.firstName) \(verb) at age \(person.age).")
                adjust(happiness: -(person.bond / 4 + 5))
                if person.kind.isParent && person.money > 0 && roll(0.7) {
                    let share = person.money / max(1, relationships.filter { $0.kind == .sibling }.count + 1)
                    money += share
                    record("I inherited \(formatMoney(share)) from \(person.firstName).")
                }
                continue
            }

            if person.kind.isRomantic && person.bond < 15 && roll(0.4) {
                let wasMarried = person.kind == .spouse
                relationships.remove(at: index)
                if wasMarried {
                    let settlement = max(0, money / 2)
                    money -= settlement
                    record("💔 \(person.firstName) divorced me and took \(formatMoney(settlement)) in the settlement.")
                } else {
                    record("💔 \(person.firstName) broke up with me.")
                }
                adjust(happiness: -15)
                return // indices changed; stop iterating this year
            }

            if person.kind == .child && person.age == 18 {
                record("My \(person.title.lowercased()) \(person.firstName) turned 18 and moved out.")
            }
        }
    }

    private func dies(age: Int, isPet: Bool) -> Bool {
        if isPet {
            return age > 8 && roll(Double(age - 8) * 0.08)
        }
        var p = 0.0005
        if age > 60 { p += Double(age - 60) * 0.008 }
        if age > 85 { p += Double(age - 85) * 0.04 }
        return roll(p)
    }

    private mutating func checkForDeath() {
        var p = 0.0003
        if age > 60 { p += Double(age - 60) * 0.006 }
        if age > 85 { p += Double(age - 85) * 0.035 }
        if stats.health < 25 { p += Double(25 - stats.health) * 0.015 }
        if stats.health == 0 || roll(p) {
            let cause: String
            if stats.health < 20 {
                cause = ["heart failure", "cancer", "pneumonia", "a stroke", "organ failure"].randomElement()!
            } else if age > 75 {
                cause = ["old age", "old age", "a heart attack", "a stroke"].randomElement()!
            } else {
                cause = ["a car accident", "a freak accident", "a heart attack", "a mysterious illness", "falling down the stairs"].randomElement()!
            }
            die(cause: cause)
        }
    }

    mutating func die(cause: String) {
        guard isAlive else { return }
        isAlive = false
        causeOfDeath = cause
        pendingEvents = []
        record("☠️ I died from \(cause) at age \(age).")
    }

    func summary() -> LifeSummary {
        LifeSummary(
            name: fullName,
            gender: gender,
            ageAtDeath: age,
            causeOfDeath: causeOfDeath ?? "unknown",
            netWorth: netWorth,
            job: job?.title ?? (isRetired ? "Retired" : nil),
            children: relationships.filter { $0.kind == .child }.count
        )
    }
}

func gradeLetter(_ grades: Int) -> String {
    switch grades {
    case 90...: return "A+"
    case 80..<90: return "A"
    case 70..<80: return "B"
    case 60..<70: return "C"
    case 50..<60: return "D"
    default: return "F"
    }
}
