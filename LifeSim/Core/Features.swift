import Foundation

// MARK: - Health

enum Illness: String, Codable, CaseIterable, Identifiable {
    case cold, flu, migraine, backPain, depression, insomnia, pneumonia
    case diabetes, heartDisease, cancer, std, brokenArm

    var id: String { rawValue }

    var name: String {
        switch self {
        case .cold: return "Common Cold"
        case .flu: return "Flu"
        case .migraine: return "Migraines"
        case .backPain: return "Back Pain"
        case .depression: return "Depression"
        case .insomnia: return "Insomnia"
        case .pneumonia: return "Pneumonia"
        case .diabetes: return "Diabetes"
        case .heartDisease: return "Heart Disease"
        case .cancer: return "Cancer"
        case .std: return "an STD"
        case .brokenArm: return "a Broken Arm"
        }
    }

    /// Health lost each year the illness goes untreated.
    var yearlyDamage: Int {
        switch self {
        case .cold, .migraine, .insomnia, .brokenArm: return 2
        case .flu, .backPain, .std: return 4
        case .depression: return 3
        case .pneumonia, .diabetes: return 8
        case .heartDisease: return 12
        case .cancer: return 18
        }
    }

    /// Base chance a regular doctor cures it.
    var curability: Double {
        switch self {
        case .cold, .flu, .brokenArm, .migraine: return 0.9
        case .backPain, .insomnia, .std, .pneumonia: return 0.7
        case .depression: return 0.4
        case .diabetes: return 0.25
        case .heartDisease: return 0.35
        case .cancer: return 0.3
        }
    }

    /// Illnesses that can show up on their own at a given age.
    static func random(forAge age: Int) -> Illness {
        var pool: [Illness] = [.cold, .cold, .flu, .flu, .migraine, .brokenArm]
        if age >= 13 { pool += [.depression, .insomnia] }
        if age >= 30 { pool += [.backPain, .pneumonia] }
        if age >= 45 { pool += [.diabetes, .heartDisease, .cancer] }
        if age >= 65 { pool += [.heartDisease, .cancer, .pneumonia] }
        return pool.randomElement()!
    }
}

enum Treatment: String, CaseIterable, Identifiable {
    case doctor, specialist, herbalist, witchDoctor, therapist

    var id: String { rawValue }

    var title: String {
        switch self {
        case .doctor: return "Doctor"
        case .specialist: return "Specialist"
        case .herbalist: return "Herbalist"
        case .witchDoctor: return "Witch Doctor"
        case .therapist: return "Therapist"
        }
    }

    var emoji: String {
        switch self {
        case .doctor: return "🩺"
        case .specialist: return "👩‍⚕️"
        case .herbalist: return "🌿"
        case .witchDoctor: return "🪬"
        case .therapist: return "🛋️"
        }
    }

    var cost: Int {
        switch self {
        case .doctor: return 200
        case .specialist: return 5_000
        case .herbalist: return 80
        case .witchDoctor: return 30
        case .therapist: return 300
        }
    }

    var cureMultiplier: Double {
        switch self {
        case .doctor: return 1.0
        case .specialist: return 1.4
        case .herbalist: return 0.4
        case .witchDoctor: return 0.2
        case .therapist: return 0
        }
    }
}

enum Addiction: String, Codable, CaseIterable, Identifiable {
    case alcohol, drugs, gambling, smoking

    var id: String { rawValue }
    var name: String {
        switch self {
        case .alcohol: return "Alcoholism"
        case .drugs: return "Drug Addiction"
        case .gambling: return "Gambling Addiction"
        case .smoking: return "Nicotine Addiction"
        }
    }
}

// MARK: - Clubs, countries, gigs

let schoolClubs: [(name: String, emoji: String)] = [
    ("Sports Team", "⚽"), ("Drama Club", "🎭"), ("Debate Team", "🗣️"),
    ("Marching Band", "🎺"), ("Chess Club", "♟️"), ("Student Council", "🗳️"),
]

enum Gig: String, CaseIterable, Identifiable {
    case mowLawns, babysit, deliverFood, rideshare, streetPerform

    var id: String { rawValue }
    var title: String {
        switch self {
        case .mowLawns: return "Mow Lawns"
        case .babysit: return "Babysit"
        case .deliverFood: return "Deliver Food"
        case .rideshare: return "Drive for Rideshare"
        case .streetPerform: return "Street Perform"
        }
    }
    var emoji: String {
        switch self {
        case .mowLawns: return "🌱"
        case .babysit: return "🍼"
        case .deliverFood: return "🛵"
        case .rideshare: return "🚕"
        case .streetPerform: return "🎸"
        }
    }
    var minAge: Int {
        switch self {
        case .mowLawns, .babysit, .streetPerform: return 10
        case .deliverFood: return 16
        case .rideshare: return 18
        }
    }
    var pay: ClosedRange<Int> {
        switch self {
        case .mowLawns: return 20...80
        case .babysit: return 30...120
        case .deliverFood: return 50...200
        case .rideshare: return 100...400
        case .streetPerform: return 0...150
        }
    }
}

// MARK: - Ribbons

enum Ribbon: String, Codable {
    case notorious, famous, rich, criminal, casanova, family, scholar, ancient
    case partyAnimal, athlete, saint, wicked, shortLived, broke, average

    var title: String {
        switch self {
        case .notorious: return "Notorious"
        case .famous: return "Famous"
        case .rich: return "Rich"
        case .criminal: return "Criminal"
        case .casanova: return "Casanova"
        case .family: return "Family"
        case .scholar: return "Scholar"
        case .ancient: return "Ancient"
        case .partyAnimal: return "Party Animal"
        case .athlete: return "Athlete"
        case .saint: return "Saint"
        case .wicked: return "Wicked"
        case .shortLived: return "Short-Lived"
        case .broke: return "Broke"
        case .average: return "Average"
        }
    }

    var emoji: String {
        switch self {
        case .notorious: return "🔪"
        case .famous: return "⭐"
        case .rich: return "💰"
        case .criminal: return "🦹"
        case .casanova: return "💋"
        case .family: return "👨‍👩‍👧‍👦"
        case .scholar: return "🎓"
        case .ancient: return "🐢"
        case .partyAnimal: return "🎉"
        case .athlete: return "🏅"
        case .saint: return "😇"
        case .wicked: return "😈"
        case .shortLived: return "🥀"
        case .broke: return "💸"
        case .average: return "😐"
        }
    }

    var blurb: String {
        switch self {
        case .notorious: return "Left a trail of bodies behind."
        case .famous: return "The whole world knew your name."
        case .rich: return "Died with a fortune."
        case .criminal: return "A life of crime."
        case .casanova: return "So many lovers."
        case .family: return "Raised a big family."
        case .scholar: return "A brilliant, educated mind."
        case .ancient: return "Lived to a ripe old age."
        case .partyAnimal: return "Never missed a party."
        case .athlete: return "Lived at the gym."
        case .saint: return "A truly good person."
        case .wicked: return "A rotten soul."
        case .shortLived: return "Gone too soon."
        case .broke: return "Died deep in debt."
        case .average: return "A perfectly ordinary life."
        }
    }
}

// MARK: - Counters

/// Keys for `Life.counters`, used for ribbons and achievements.
enum Counter: String {
    case partners, parties, crimes, murders, gym, lotteryWins, gigsThisYear
}
