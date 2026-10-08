import Foundation

extension Life {
    // MARK: Health

    mutating func treat(with treatment: Treatment) -> Outcome {
        money -= treatment.cost
        var message: String

        if treatment == .therapist {
            adjust(happiness: .random(in: 5...12))
            if illnesses.contains(.depression) && roll(0.5) {
                illnesses.removeAll { $0 == .depression }
                message = "🛋️ My therapist helped me beat my depression."
            } else {
                message = "🛋️ I talked through my problems with a therapist. I feel a bit lighter."
            }
            record(message)
            return Outcome(title: treatment.title, message: message)
        }

        if treatment == .witchDoctor && roll(0.25) {
            adjust(health: -10)
            message = "🪬 The witch doctor made me drink something foul. I feel worse."
            record(message)
            return Outcome(title: treatment.title, message: message)
        }

        if illnesses.isEmpty {
            adjust(health: .random(in: 2...8))
            message = "\(treatment.emoji) The \(treatment.title.lowercased()) says I'm perfectly healthy."
        } else {
            var cured: [Illness] = []
            for illness in illnesses where roll(min(0.97, illness.curability * treatment.cureMultiplier)) {
                cured.append(illness)
            }
            illnesses.removeAll { cured.contains($0) }
            if cured.isEmpty {
                message = "\(treatment.emoji) The \(treatment.title.lowercased()) couldn't cure me."
            } else {
                adjust(happiness: 8, health: 10 * cured.count)
                message = "\(treatment.emoji) The \(treatment.title.lowercased()) cured my \(cured.map(\.name).joined(separator: ", "))!"
            }
        }
        record(message)
        return Outcome(title: treatment.title, message: message)
    }

    mutating func goToRehab() -> Outcome {
        money -= 15_000
        let message: String
        if roll(0.6) {
            let fixed = addictions.map(\.name).joined(separator: ", ")
            addictions.removeAll()
            adjust(happiness: 10, health: 10)
            message = "I completed rehab and kicked my \(fixed.lowercased())!"
        } else {
            message = "I went to rehab, but I relapsed as soon as I got out."
        }
        record(message)
        return Outcome(title: "Rehab", message: message)
    }

    // MARK: Licenses & moving

    var canTakeDrivingTest: Bool { age >= 16 && !hasDriversLicense && !inPrison }

    mutating func takeDrivingTest() -> Outcome {
        let message: String
        if roll(0.4 + Double(stats.smarts) / 200) {
            hasDriversLicense = true
            adjust(happiness: 10)
            message = "🚗 I passed my driving test and got my license!"
        } else {
            adjust(happiness: -5)
            message = "I failed my driving test. \(["I hit a cone.", "I forgot to signal.", "I ran a stop sign.", "I parallel parked on the curb."].randomElement()!)"
        }
        record(message)
        return Outcome(title: "Driving Test", message: message)
    }

    mutating func emigrate(to place: (String, String)) -> Outcome {
        guard age >= 18 else {
            return Outcome(title: "Emigrate", message: "I'm too young to move abroad by myself.")
        }
        let cost = 5_000
        guard money >= cost else {
            return Outcome(title: "Emigrate", message: "I need \(formatMoney(cost)) to move abroad.")
        }
        money -= cost
        city = place.0
        country = place.1
        if let current = job { record("I left my job as a \(current.title).") }
        job = nil
        adjust(happiness: 8)
        let message = "✈️ I emigrated to \(place.0), \(place.1)!"
        record(message)
        return Outcome(title: "Emigrate", message: message)
    }

    // MARK: Adoption

    mutating func adoptPet(_ species: String) -> Outcome {
        guard age >= 8 else { return Outcome(title: "Pet Shelter", message: "My parents said I'm too young for a pet.") }
        money -= 200
        let pet = Relationship(kind: .pet, firstName: Names.petNames.randomElement()!, lastName: "", gender: .allCases.randomElement()!, age: .random(in: 0...6), bond: 75, species: species)
        relationships.append(pet)
        adjust(happiness: 10)
        let message = "\(petEmoji[species] ?? "🐾") I adopted a \(species.lowercased()) named \(pet.firstName) from the shelter."
        record(message)
        return Outcome(title: "Pet Shelter", message: message)
    }

    var canAdoptChild: Bool { age >= 21 && age <= 65 && !inPrison }

    mutating func adoptChild() -> Outcome {
        guard money >= 10_000 else {
            return Outcome(title: "Adoption", message: "I need $10,000 to cover the adoption fees.")
        }
        guard criminalRecord.isEmpty || roll(0.2) else {
            return Outcome(title: "Adoption", message: "The agency rejected me because of my criminal record.")
        }
        money -= 10_000
        let gender = Gender.allCases.randomElement()!
        let child = Relationship(kind: .child, firstName: Names.first(for: gender), lastName: lastName, gender: gender, age: .random(in: 0...10), bond: 80)
        relationships.append(child)
        adjust(happiness: 15)
        let message = "👶 I adopted a \(child.age)-year-old \(gender == .male ? "boy" : "girl") named \(child.firstName)!"
        record(message)
        return Outcome(title: "Adoption", message: message)
    }

    // MARK: Love

    var canHookUp: Bool { age >= 18 && !inPrison }

    mutating func hookUp() -> Outcome {
        let person = Names.person(kind: .friend, age: max(18, age + .random(in: -6...6)), gender: preferredGender)
        bump(.partners)
        adjust(happiness: 8)
        var message = "🔥 I hooked up with \(person.fullName) (\(person.age))."
        if roll(0.08) && !illnesses.contains(.std) {
            illnesses.append(.std)
            message += " A week later I tested positive for an STD."
        }
        if let partner = romanticPartner {
            karma -= 5
            if roll(partner.trait == .jealous ? 0.6 : 0.35) {
                updateRelationship(partner.id) { $0.bond -= 45 }
                adjust(happiness: -15)
                message += " \(partner.firstName) found out I cheated!"
            }
        }
        record(message)
        return Outcome(title: "Hookup", message: message)
    }

    // MARK: Gigs & social media

    func canDo(_ gig: Gig) -> Bool { age >= gig.minAge && !inPrison && count(.gigsThisYear) < 3 }

    mutating func work(_ gig: Gig) -> Outcome {
        bump(.gigsThisYear)
        let pay = Int.random(in: gig.pay)
        money += pay
        let message = pay == 0
            ? "\(gig.emoji) Nobody paid me anything for my \(gig.title.lowercased()) gig."
            : "\(gig.emoji) I earned \(formatMoney(pay)) doing a \(gig.title.lowercased()) gig."
        record(message)
        return Outcome(title: gig.title, message: message)
    }

    var canPostOnSocialMedia: Bool { age >= 13 && !inPrison }

    mutating func postOnSocialMedia() -> Outcome {
        let base = Double(stats.looks + fame * 2) / 100
        let viral = roll(0.04 + Double(fame) / 500)
        var gained = Int(Double.random(in: 1...40) * base * (viral ? 200 : 1)) + followers / 50
        if roll(0.1) { gained = -Int(Double(followers) * 0.1) }
        followers = max(0, followers + gained)
        var message: String
        if viral {
            message = "📱 My post went VIRAL! I gained \(gained.formatted()) followers."
            fame = min(100, fame + 5)
            adjust(happiness: 12)
        } else if gained < 0 {
            message = "📱 My post was ratioed and I lost \((-gained).formatted()) followers."
            adjust(happiness: -5)
        } else {
            message = "📱 I posted on social media and gained \(gained.formatted()) followers."
            adjust(happiness: 2)
        }
        if followers >= 100_000 {
            let deal = followers / 20
            money += deal
            fame = min(100, max(fame, followers / 20_000))
            message += " A brand paid me \(formatMoney(deal)) for a sponsored post."
        }
        record(message)
        return Outcome(title: "Social Media", message: message)
    }

    // MARK: School life

    mutating func joinClub(_ club: String) -> Outcome {
        if !clubs.contains(club) { clubs.append(club) }
        popularity = min(100, popularity + .random(in: 3...10))
        switch club {
        case "Sports Team": adjust(happiness: 4, health: 5)
        case "Debate Team", "Chess Club": adjust(happiness: 2, smarts: 4)
        case "Drama Club": adjust(happiness: 5, looks: 2)
        default: adjust(happiness: 4)
        }
        let message = "I joined the \(club.lowercased())."
        record(message)
        return Outcome(title: club, message: message)
    }

    mutating func skipSchool() -> Outcome {
        schoolGrades = max(0, schoolGrades - .random(in: 3...8))
        let message: String
        if roll(0.3) {
            adjust(happiness: -6)
            message = "I skipped school, got caught, and was given detention."
        } else {
            adjust(happiness: 6)
            popularity = min(100, popularity + 3)
            message = "I skipped school and hung out at the mall all day."
        }
        record(message)
        return Outcome(title: "Skip School", message: message)
    }
}
