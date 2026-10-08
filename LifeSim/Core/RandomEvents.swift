import Foundation

enum RandomEvents {
    /// Adds 0–2 things that "just happen" this year, plus maybe a choice event.
    static func generate(for life: inout Life) {
        passiveEvent(&life)
        if roll(0.55), let event = choiceEvent(for: life) {
            life.pendingEvents.append(event)
        }
    }

    // MARK: Passive events

    private static func passiveEvent(_ life: inout Life) {
        guard roll(0.5) else { return }
        let age = life.age
        var options: [(inout Life) -> Void] = []

        if age <= 4 {
            options.append { $0.record("I said my first words: \"\(["mama", "dada", "no", "cookie", "dog"].randomElement()!)\"."); $0.adjust(happiness: 3) }
            options.append { $0.record("I fell off the couch and bumped my head."); $0.adjust(health: -3) }
            options.append { $0.record("I learned to walk!"); $0.adjust(happiness: 4) }
        }
        if (5...17).contains(age) {
            options.append { $0.record("I got a gold star from my teacher."); $0.schoolGrades += 5; $0.adjust(happiness: 4) }
            options.append { $0.record("I caught the flu and missed a week of school."); $0.adjust(health: -6) }
            options.append { $0.record("I went on a school field trip to the museum."); $0.adjust(happiness: 5, smarts: 2) }
        }
        if (13...19).contains(age) {
            options.append { $0.record("I got a bad case of acne."); $0.adjust(happiness: -4, looks: -4) }
            options.append { $0.record("I hit a growth spurt!"); $0.adjust(looks: 4) }
        }
        if age >= 18 {
            options.append { life in
                let amount = Int.random(in: 20...500)
                life.money += amount
                life.record("I found \(formatMoney(amount)) on the sidewalk.")
                life.adjust(happiness: 3)
            }
            options.append { $0.record("I sprained my ankle while jogging."); $0.adjust(health: -5) }
            options.append { $0.record("I had a wonderful dream last night."); $0.adjust(happiness: 4) }
            options.append { life in
                let bill = Int.random(in: 200...3_000)
                life.money -= bill
                life.record("My appliances broke down. Repairs cost \(formatMoney(bill)).")
                life.adjust(happiness: -3)
            }
        }
        if age >= 50 {
            options.append { $0.record("My back has been aching."); $0.adjust(happiness: -3, health: -4) }
        }
        if let event = options.randomElement() {
            event(&life)
        }
    }

    // MARK: Choice events

    private static func choiceEvent(for life: Life) -> PendingEvent? {
        let age = life.age
        var events: [PendingEvent] = []

        if (6...17).contains(age) {
            let bully = Names.first(for: .allCases.randomElement()!)
            events.append(PendingEvent(
                kind: .bully(name: bully),
                title: "Bully",
                message: "\(bully), a kid at school, has been bullying you and just shoved you into a locker. What do you do?",
                options: ["Fight back", "Tell a teacher", "Ignore it"]
            ))
        }
        if (10...17).contains(age) {
            events.append(PendingEvent(
                kind: .cheatOnTest,
                title: "Big Test",
                message: "A classmate offers you the answers to tomorrow's big exam.",
                options: ["Take the answers", "Study instead", "Report them"]
            ))
            let friend = Names.person(kind: .friend, age: age + .random(in: -1...1), bond: .random(in: 40...70))
            events.append(PendingEvent(
                kind: .friendship(friend),
                title: "New Classmate",
                message: "\(friend.fullName) wants to be your friend.",
                options: ["Accept", "Decline"]
            ))
        }
        if (14...30).contains(age) {
            events.append(PendingEvent(
                kind: .drugsOffer,
                title: "Party",
                message: "Someone at a party offers you some sketchy-looking pills.",
                options: ["Take them", "Say no"]
            ))
        }
        if (16...60).contains(age) && life.romanticPartner == nil {
            let gender: Gender = life.gender == .male ? .female : .male
            var person = Names.person(kind: .partner, age: max(16, age + .random(in: -4...4)), gender: gender, bond: .random(in: 50...80))
            person.money = .random(in: 0...150_000)
            events.append(PendingEvent(
                kind: .askedOut(person),
                title: "Love is in the air",
                message: "\(person.fullName) (\(person.age)) asked you out on a date. Looks: \(person.looks)%.",
                options: ["Say yes", "Say no"]
            ))
        }
        if age >= 8 {
            let species = Names.petSpecies.randomElement()!
            events.append(PendingEvent(
                kind: .strayAnimal(species: species),
                title: "Stray \(species)",
                message: "A stray \(species.lowercased()) followed you home. It looks hungry.",
                options: ["Adopt it", "Shoo it away"]
            ))
            let amount = Int.random(in: 50...2_000)
            events.append(PendingEvent(
                kind: .foundWallet(amount: amount),
                title: "Lost Wallet",
                message: "You found a wallet on the ground containing \(formatMoney(amount)) and an ID.",
                options: ["Return it", "Keep the cash"]
            ))
        }
        if age >= 18 {
            events.append(PendingEvent(
                kind: .streetFight,
                title: "Confrontation",
                message: "A drunk stranger is trying to pick a fight with you outside a bar.",
                options: ["Fight", "Walk away", "Call the police"]
            ))
            events.append(PendingEvent(
                kind: .mugger,
                title: "Mugger!",
                message: "A man with a knife demands your wallet.",
                options: ["Hand it over", "Fight him", "Run"]
            ))
        }
        if age >= 21 && life.money > 5_000 {
            let amount = min(life.money / 2, Int.random(in: 2_000...50_000))
            events.append(PendingEvent(
                kind: .investmentPitch(amount: amount),
                title: "Investment Opportunity",
                message: "An old friend wants you to invest \(formatMoney(amount)) in their new startup.",
                options: ["Invest", "Pass"]
            ))
        }
        if life.job != nil && !(life.job?.partTime ?? true) {
            events.append(PendingEvent(
                kind: .coworkerCredit,
                title: "Office Drama",
                message: "A coworker took credit for your work in front of the boss.",
                options: ["Confront them", "Tell the boss", "Let it go"]
            ))
        }
        return events.randomElement()
    }
}

// MARK: - Resolving choices

extension Life {
    mutating func resolve(_ event: PendingEvent, choice: Int) -> Outcome {
        pendingEvents.removeAll { $0.id == event.id }
        let result = outcomeText(for: event.kind, choice: choice)
        record(result)
        return Outcome(title: event.title, message: result)
    }

    private mutating func outcomeText(for kind: EventKind, choice: Int) -> String {
        switch kind {
        case .bully(let name):
            switch choice {
            case 0:
                if roll(0.5) { adjust(happiness: 10, health: -3); return "I fought back and gave \(name) a black eye. They won't bother me again." }
                adjust(happiness: -10, health: -10); return "I tried to fight \(name) but got beaten up."
            case 1:
                adjust(happiness: 3); return "I told a teacher and \(name) got detention."
            default:
                adjust(happiness: -5); return "I ignored \(name)'s bullying."
            }

        case .cheatOnTest:
            switch choice {
            case 0:
                if roll(0.3) { schoolGrades -= 15; karma -= 5; adjust(happiness: -10); return "I got caught cheating and received a zero!" }
                schoolGrades += 8; karma -= 3; return "I used the answers and aced the exam."
            case 1:
                schoolGrades += 4; adjust(smarts: 3); return "I studied hard for the exam."
            default:
                karma += 5; return "I reported the cheater to the principal."
            }

        case .friendship(let friend):
            if choice == 0 {
                relationships.append(friend)
                adjust(happiness: 5)
                return "I became friends with \(friend.fullName)."
            }
            return "I turned down \(friend.firstName)'s friendship."

        case .drugsOffer:
            if choice == 0 {
                if roll(0.15) { die(cause: "a drug overdose"); return "I overdosed." }
                adjust(happiness: 8, health: -12, smarts: -3)
                return "I took the pills and had a wild night. I feel awful now."
            }
            return "I said no to drugs."

        case .askedOut(let person):
            if choice == 0 {
                relationships.append(person)
                adjust(happiness: 10)
                return "I started dating \(person.fullName)."
            }
            return "I turned \(person.firstName) down."

        case .strayAnimal(let species):
            if choice == 0 {
                let pet = Relationship(kind: .pet, firstName: Names.petNames.randomElement()!, lastName: "", gender: .allCases.randomElement()!, age: .random(in: 1...4), bond: 70, species: species)
                relationships.append(pet)
                adjust(happiness: 10)
                return "I adopted a \(species.lowercased()) and named it \(pet.firstName)."
            }
            return "I shooed the \(species.lowercased()) away."

        case .foundWallet(let amount):
            if choice == 0 {
                karma += 6
                adjust(happiness: 5)
                if roll(0.3) {
                    money += 100
                    return "I returned the wallet. The grateful owner gave me a $100 reward!"
                }
                return "I returned the wallet to its owner."
            }
            karma -= 6
            money += amount
            return "I kept the \(formatMoney(amount))."

        case .streetFight:
            switch choice {
            case 0:
                if roll(0.5) { adjust(happiness: 5, health: -4); return "I won the fight and walked away with a few bruises." }
                if roll(0.2) {
                    criminalRecord.append("Assault")
                    sendToPrison(years: 1)
                    return "I won, but the police arrested me for assault. I was sentenced to 1 year in prison."
                }
                adjust(happiness: -5, health: -15); return "I lost the fight and ended up in the hospital."
            case 1:
                return "I walked away from the fight."
            default:
                karma += 2; return "I called the police and they took the stranger away."
            }

        case .mugger:
            switch choice {
            case 0:
                let lost = min(max(money, 0), Int.random(in: 20...400))
                money -= lost
                adjust(happiness: -5)
                return "I handed over my wallet and lost \(formatMoney(lost))."
            case 1:
                if roll(0.4) { adjust(happiness: 10); return "I disarmed the mugger and he ran off!" }
                if roll(0.1) { die(cause: "a stab wound"); return "The mugger stabbed me." }
                adjust(health: -25); return "The mugger stabbed me. I survived, but barely."
            default:
                if roll(0.7) { return "I ran away and escaped." }
                adjust(health: -8); return "I tripped while running and the mugger caught me."
            }

        case .investmentPitch(let amount):
            if choice == 0 {
                money -= amount
                if roll(0.25) {
                    let payout = amount * Int.random(in: 3...10)
                    money += payout
                    adjust(happiness: 20)
                    return "The startup was a huge success! My \(formatMoney(amount)) investment returned \(formatMoney(payout))."
                }
                adjust(happiness: -10)
                return "The startup went bust and I lost my \(formatMoney(amount)) investment."
            }
            return "I passed on the investment."

        case .coworkerCredit:
            switch choice {
            case 0:
                if roll(0.5) { job?.performance += 5; return "I confronted my coworker and they backed down." }
                job?.performance -= 5; return "Confronting my coworker turned into an HR complaint against me."
            case 1:
                job?.performance += 8; return "My boss believed me and praised my work."
            default:
                adjust(happiness: -4); return "I let my coworker take the credit."
            }
        }
    }
}
