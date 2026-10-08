import Foundation

enum Names {
    static let male = [
        "James", "Liam", "Noah", "Oliver", "Elijah", "Lucas", "Mason", "Logan", "Ethan", "Aiden",
        "Jacob", "Michael", "Daniel", "Henry", "Jackson", "Sebastian", "Mateo", "Leo", "Owen", "Samuel",
        "David", "Joseph", "Carter", "Wyatt", "Jayden", "Gabriel", "Julian", "Isaac", "Anthony", "Dylan",
        "Noam", "Ari", "Omar", "Kenji", "Diego", "Marco", "Andre", "Felix", "Hugo", "Ravi",
    ]

    static let female = [
        "Olivia", "Emma", "Charlotte", "Amelia", "Ava", "Sophia", "Isabella", "Mia", "Evelyn", "Harper",
        "Luna", "Camila", "Gianna", "Elizabeth", "Eleanor", "Ella", "Abigail", "Sofia", "Avery", "Scarlett",
        "Emily", "Aria", "Penelope", "Chloe", "Layla", "Mila", "Nora", "Hazel", "Madison", "Ellie",
        "Noa", "Yael", "Aisha", "Yuki", "Lucia", "Chiara", "Zara", "Ingrid", "Priya", "Maya",
    ]

    static let last = [
        "Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis", "Rodriguez", "Martinez",
        "Hernandez", "Lopez", "Wilson", "Anderson", "Thomas", "Taylor", "Moore", "Jackson", "Martin", "Lee",
        "Thompson", "White", "Harris", "Clark", "Lewis", "Robinson", "Walker", "Young", "King", "Wright",
        "Levi", "Cohen", "Tanaka", "Rossi", "Müller", "Nguyen", "Kim", "Patel", "Silva", "Novak",
    ]

    static let places = [
        ("New York", "United States"), ("Los Angeles", "United States"), ("Chicago", "United States"),
        ("Austin", "United States"), ("London", "United Kingdom"), ("Manchester", "United Kingdom"),
        ("Toronto", "Canada"), ("Vancouver", "Canada"), ("Sydney", "Australia"), ("Melbourne", "Australia"),
        ("Tel Aviv", "Israel"), ("Berlin", "Germany"), ("Paris", "France"), ("Rome", "Italy"),
        ("Madrid", "Spain"), ("Tokyo", "Japan"), ("Dublin", "Ireland"), ("Amsterdam", "Netherlands"),
    ]

    static let petNames = ["Max", "Bella", "Charlie", "Luna", "Rocky", "Coco", "Buddy", "Daisy", "Milo", "Pepper"]
    static let petSpecies = ["Dog", "Cat", "Rabbit", "Parrot", "Hamster"]

    static let cars = [
        ("Used Hatchback", 4_000), ("Compact Sedan", 18_000), ("Family SUV", 35_000),
        ("Pickup Truck", 42_000), ("Electric Sedan", 55_000), ("Luxury Sedan", 85_000),
        ("Sports Car", 140_000), ("Supercar", 320_000),
    ]

    static let houses = [
        ("Studio Apartment", 120_000), ("Condo", 240_000), ("Townhouse", 380_000),
        ("Suburban House", 520_000), ("Beach House", 950_000), ("Penthouse", 1_800_000),
        ("Mansion", 4_500_000), ("Castle", 12_000_000),
    ]

    static func first(for gender: Gender) -> String {
        (gender == .male ? male : female).randomElement()!
    }

    static func randomLast() -> String { last.randomElement()! }

    static func person(kind: RelationKind, age: Int, gender: Gender? = nil, lastName: String? = nil, bond: Int? = nil) -> Relationship {
        let g = gender ?? Gender.allCases.randomElement()!
        return Relationship(
            kind: kind,
            firstName: first(for: g),
            lastName: lastName ?? randomLast(),
            gender: g,
            age: age,
            bond: bond ?? .random(in: 40...90),
            money: .random(in: 0...80_000)
        )
    }
}
