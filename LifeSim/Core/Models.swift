import Foundation

// MARK: - Helpers

extension Comparable {
    func clamped(to range: ClosedRange<Self>) -> Self {
        min(max(self, range.lowerBound), range.upperBound)
    }
}

/// Returns true with the given probability (0...1).
func roll(_ probability: Double) -> Bool {
    Double.random(in: 0..<1) < probability
}

func formatMoney(_ amount: Int) -> String {
    let formatter = NumberFormatter()
    formatter.numberStyle = .decimal
    formatter.maximumFractionDigits = 0
    let digits = formatter.string(from: NSNumber(value: abs(amount))) ?? "\(abs(amount))"
    return amount < 0 ? "-$\(digits)" : "$\(digits)"
}

// MARK: - Basics

enum Gender: String, Codable, CaseIterable, Identifiable {
    case male, female

    var id: String { rawValue }
    var label: String { self == .male ? "Male" : "Female" }
    var subject: String { self == .male ? "he" : "she" }
    var object: String { self == .male ? "him" : "her" }
    var possessive: String { self == .male ? "his" : "her" }
}

struct Stats: Codable, Equatable {
    var happiness: Int
    var health: Int
    var smarts: Int
    var looks: Int

    static func random() -> Stats {
        Stats(
            happiness: .random(in: 60...100),
            health: .random(in: 70...100),
            smarts: .random(in: 5...100),
            looks: .random(in: 5...100)
        )
    }

    mutating func clamp() {
        happiness = happiness.clamped(to: 0...100)
        health = health.clamped(to: 0...100)
        smarts = smarts.clamped(to: 0...100)
        looks = looks.clamped(to: 0...100)
    }
}

// MARK: - Education

enum EducationLevel: Int, Codable, Comparable {
    case none = 0, highSchool, bachelor, graduate

    static func < (lhs: EducationLevel, rhs: EducationLevel) -> Bool { lhs.rawValue < rhs.rawValue }

    var label: String {
        switch self {
        case .none: return "None"
        case .highSchool: return "High School Diploma"
        case .bachelor: return "Bachelor's Degree"
        case .graduate: return "Graduate Degree"
        }
    }
}

enum GraduateField: String, Codable, CaseIterable, Identifiable {
    case medicine, law, business

    var id: String { rawValue }

    var schoolName: String {
        switch self {
        case .medicine: return "Medical School"
        case .law: return "Law School"
        case .business: return "Business School"
        }
    }

    var degreeName: String {
        switch self {
        case .medicine: return "M.D."
        case .law: return "J.D."
        case .business: return "MBA"
        }
    }

    var years: Int {
        switch self {
        case .medicine: return 4
        case .law: return 3
        case .business: return 2
        }
    }

    var tuitionPerYear: Int {
        switch self {
        case .medicine: return 55_000
        case .law: return 48_000
        case .business: return 60_000
        }
    }
}

enum SchoolKind: Codable, Equatable {
    case university(major: String)
    case graduate(GraduateField)

    var name: String {
        switch self {
        case .university(let major): return "University (\(major))"
        case .graduate(let field): return field.schoolName
        }
    }
}

struct Enrollment: Codable, Equatable {
    var kind: SchoolKind
    var yearsLeft: Int
    var grades: Int
}

let universityMajors = [
    "Computer Science", "Engineering", "Biology", "Nursing", "Business",
    "Psychology", "English", "Art", "Economics", "Education",
]

let universityTuitionPerYear = 25_000

// MARK: - Jobs

struct JobTemplate: Identifiable, Hashable {
    let id: String
    let title: String
    let baseSalary: Int
    var requiredEducation: EducationLevel = .none
    var requiredField: GraduateField? = nil
    var requiredMajor: String? = nil
    var minAge: Int = 18
    var minSmarts: Int = 0
    var minLooks: Int = 0
    var partTime: Bool = false
    /// Salary grows with fame (actors, musicians, athletes).
    var famous: Bool = false
    var military: Bool = false
    var maxAge: Int = 70
    var minHealth: Int = 0

    var requirementText: String {
        var parts: [String] = []
        if let field = requiredField {
            parts.append(field.degreeName)
        } else if let major = requiredMajor {
            parts.append("Degree in \(major)")
        } else if requiredEducation > .none {
            parts.append(requiredEducation.label)
        }
        if minLooks > 0 { parts.append("Good looks") }
        if minHealth > 0 { parts.append("Fit & healthy") }
        if maxAge < 70 { parts.append("Age \(minAge)–\(maxAge)") }
        if famous { parts.append("Audition") }
        if parts.isEmpty { parts.append("No requirements") }
        return parts.joined(separator: " · ")
    }
}

let jobCatalog: [JobTemplate] = [
    JobTemplate(id: "babysitter", title: "Babysitter", baseSalary: 6_000, minAge: 14, partTime: true),
    JobTemplate(id: "cashier", title: "Cashier", baseSalary: 9_000, minAge: 15, partTime: true),
    JobTemplate(id: "lifeguard", title: "Lifeguard", baseSalary: 8_500, minAge: 15, partTime: true),
    JobTemplate(id: "dogwalker", title: "Dog Walker", baseSalary: 5_000, minAge: 14, partTime: true),

    JobTemplate(id: "janitor", title: "Janitor", baseSalary: 26_000),
    JobTemplate(id: "fastfood", title: "Fast Food Worker", baseSalary: 22_000),
    JobTemplate(id: "barista", title: "Barista", baseSalary: 24_000),
    JobTemplate(id: "construction", title: "Construction Worker", baseSalary: 38_000),
    JobTemplate(id: "trucker", title: "Truck Driver", baseSalary: 48_000),
    JobTemplate(id: "receptionist", title: "Receptionist", baseSalary: 32_000, requiredEducation: .highSchool),
    JobTemplate(id: "police", title: "Police Officer", baseSalary: 55_000, requiredEducation: .highSchool, minSmarts: 30),
    JobTemplate(id: "firefighter", title: "Firefighter", baseSalary: 52_000, requiredEducation: .highSchool),
    JobTemplate(id: "model", title: "Fashion Model", baseSalary: 60_000, minLooks: 80),
    JobTemplate(id: "teacher", title: "Teacher", baseSalary: 50_000, requiredMajor: "Education"),
    JobTemplate(id: "nurse", title: "Nurse", baseSalary: 72_000, requiredMajor: "Nursing"),
    JobTemplate(id: "engineer", title: "Mechanical Engineer", baseSalary: 85_000, requiredMajor: "Engineering", minSmarts: 50),
    JobTemplate(id: "software", title: "Software Engineer", baseSalary: 110_000, requiredMajor: "Computer Science", minSmarts: 55),
    JobTemplate(id: "accountant", title: "Accountant", baseSalary: 65_000, requiredEducation: .bachelor, minSmarts: 40),
    JobTemplate(id: "marketing", title: "Marketing Associate", baseSalary: 58_000, requiredEducation: .bachelor),
    JobTemplate(id: "psych", title: "Psychologist", baseSalary: 82_000, requiredMajor: "Psychology", minSmarts: 50),
    JobTemplate(id: "doctor", title: "Doctor", baseSalary: 210_000, requiredEducation: .graduate, requiredField: .medicine, minSmarts: 70),
    JobTemplate(id: "lawyer", title: "Lawyer", baseSalary: 140_000, requiredEducation: .graduate, requiredField: .law, minSmarts: 60),
    JobTemplate(id: "banker", title: "Investment Banker", baseSalary: 160_000, requiredEducation: .graduate, requiredField: .business, minSmarts: 60),
    JobTemplate(id: "chef", title: "Line Cook", baseSalary: 30_000),
    JobTemplate(id: "pilot", title: "Airline Pilot", baseSalary: 130_000, requiredEducation: .bachelor, minSmarts: 55),
    JobTemplate(id: "scientist", title: "Research Scientist", baseSalary: 95_000, requiredMajor: "Biology", minSmarts: 65),
    JobTemplate(id: "soldier", title: "Army Private", baseSalary: 32_000, minSmarts: 0, military: true, maxAge: 35, minHealth: 50),
    JobTemplate(id: "actor", title: "Actor", baseSalary: 25_000, minLooks: 50, famous: true),
    JobTemplate(id: "musician", title: "Musician", baseSalary: 20_000, famous: true),
    JobTemplate(id: "athlete", title: "Pro Athlete", baseSalary: 60_000, famous: true, maxAge: 32, minHealth: 80),
]

let companyNames = [
    "Acme Corp", "Globex", "Initech", "Umbrella Inc", "Stark Industries", "Wayne Enterprises",
    "Hooli", "Pied Piper", "Vandelay Industries", "Dunder Mifflin", "Soylent", "Cyberdyne",
    "City Hospital", "County Schools", "Burger Barn", "Bean Machine", "MegaMart",
]

struct JobOpening: Identifiable {
    let id = UUID()
    let template: JobTemplate
    let company: String
    let salary: Int
}

struct Job: Codable, Equatable {
    var templateID: String
    var title: String
    var company: String
    var salary: Int
    /// The salary offered at the entry level; later levels scale from this.
    var baseSalary: Int
    var years = 0
    var performance = 50
    var partTime: Bool
    var level = 0
    var yearsInLevel = 0
    /// Chosen specialization for careers that branch (e.g. police SWAT).
    var track: String?
    /// Job actions already used this year.
    var usedActions: [String] = []

    init(templateID: String, title: String, company: String, salary: Int, partTime: Bool) {
        self.templateID = templateID
        self.title = title
        self.company = company
        self.salary = salary
        self.baseSalary = salary
        self.partTime = partTime
    }

    init(from decoder: Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        templateID = try c.decode(String.self, forKey: .templateID)
        title = try c.decode(String.self, forKey: .title)
        company = try c.decode(String.self, forKey: .company)
        salary = try c.decode(Int.self, forKey: .salary)
        baseSalary = try c.decodeIfPresent(Int.self, forKey: .baseSalary) ?? salary
        years = try c.decodeIfPresent(Int.self, forKey: .years) ?? 0
        performance = try c.decodeIfPresent(Int.self, forKey: .performance) ?? 50
        partTime = try c.decodeIfPresent(Bool.self, forKey: .partTime) ?? false
        level = try c.decodeIfPresent(Int.self, forKey: .level) ?? 0
        yearsInLevel = try c.decodeIfPresent(Int.self, forKey: .yearsInLevel) ?? 0
        track = try c.decodeIfPresent(String.self, forKey: .track)
        // Saves from before police branching: senior officers become Patrol.
        if templateID == "police" && track == nil && level >= 2 { track = "patrol" }
        usedActions = try c.decodeIfPresent([String].self, forKey: .usedActions) ?? []
    }
}

// MARK: - Relationships

enum RelationKind: String, Codable {
    case mother, father, sibling, partner, fiance, spouse, child, friend, pet

    var label: String {
        switch self {
        case .mother: return "Mother"
        case .father: return "Father"
        case .sibling: return "Sibling"
        case .partner: return "Partner"
        case .fiance: return "Fiancé(e)"
        case .spouse: return "Spouse"
        case .child: return "Child"
        case .friend: return "Friend"
        case .pet: return "Pet"
        }
    }

    var isRomantic: Bool { self == .partner || self == .fiance || self == .spouse }
    var isParent: Bool { self == .mother || self == .father }
}

struct Relationship: Codable, Identifiable, Equatable {
    var id = UUID()
    var kind: RelationKind
    var firstName: String
    var lastName: String
    var gender: Gender
    var age: Int
    var bond: Int
    var looks: Int = .random(in: 10...100)
    var money: Int = 0
    var species: String? = nil
    var isAlive = true

    var fullName: String { species == nil ? "\(firstName) \(lastName)" : firstName }

    var title: String {
        switch kind {
        case .sibling: return gender == .male ? "Brother" : "Sister"
        case .child: return gender == .male ? "Son" : "Daughter"
        case .partner: return gender == .male ? "Boyfriend" : "Girlfriend"
        case .spouse: return gender == .male ? "Husband" : "Wife"
        case .fiance: return gender == .male ? "Fiancé" : "Fiancée"
        case .pet: return species ?? "Pet"
        default: return kind.label
        }
    }

    var emoji: String {
        if let species = species { return petEmoji[species] ?? "🐾" }
        if !isAlive { return "🪦" }
        return avatarEmoji(age: age, gender: gender)
    }
}

let petEmoji: [String: String] = ["Dog": "🐶", "Cat": "🐱", "Rabbit": "🐰", "Parrot": "🦜", "Hamster": "🐹"]

func avatarEmoji(age: Int, gender: Gender) -> String {
    switch age {
    case ..<3: return "👶"
    case ..<13: return gender == .male ? "👦" : "👧"
    case ..<20: return gender == .male ? "🧑" : "👩‍🦰"
    case ..<60: return gender == .male ? "👨" : "👩"
    default: return gender == .male ? "👴" : "👵"
    }
}

// MARK: - Assets

enum AssetKind: String, Codable {
    case house, car, boat
}

struct Asset: Codable, Identifiable, Equatable {
    var id = UUID()
    var kind: AssetKind
    var name: String
    var purchasePrice: Int
    var value: Int
    var yearsOwned = 0
    /// Outstanding mortgage / loan on this asset.
    var loan = 0

    var emoji: String { kind.emoji }
}

extension AssetKind {
    var emoji: String {
        switch self {
        case .house: return "🏠"
        case .car: return "🚗"
        case .boat: return "🛥️"
        }
    }
}

struct AssetListing: Identifiable, Hashable {
    let id = UUID()
    let kind: AssetKind
    let name: String
    let price: Int
}

// MARK: - Log & Events

struct YearLog: Codable, Identifiable, Equatable {
    var id: Int { age }
    let age: Int
    var entries: [String]
}

/// An event that interrupts the year and asks the player to choose.
enum EventKind: Codable {
    case foundWallet(amount: Int)
    case bully(name: String)
    case drugsOffer
    case cheatOnTest
    case strayAnimal(species: String)
    case friendship(Relationship)
    case askedOut(Relationship)
    case streetFight
    case investmentPitch(amount: Int)
    case coworkerCredit
    case mugger
    case siblingNeedsMoney(name: String, amount: Int)
    case prom(Relationship)
    case craving(Addiction)
    case celebrity
    case juryDuty
    case drunkDriving
}

struct PendingEvent: Codable, Identifiable {
    var id = UUID()
    let kind: EventKind
    let title: String
    let message: String
    let options: [String]
}

/// The result of an action, shown to the player as a popup.
struct Outcome: Identifiable {
    let id = UUID()
    let title: String
    let message: String
}

/// A short record of a finished life, kept in the graveyard.
struct LifeSummary: Codable, Identifiable {
    var id = UUID()
    let name: String
    let gender: Gender
    let ageAtDeath: Int
    let causeOfDeath: String
    let netWorth: Int
    let job: String?
    let children: Int
    var ribbon: Ribbon? = nil
    var generation: Int? = nil
}
