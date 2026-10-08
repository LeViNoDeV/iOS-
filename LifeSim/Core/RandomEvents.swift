import Foundation

enum RandomEvents {
    /// Adds 0–2 things that "just happen" this year, plus maybe a choice event.
    static func generate(for life: inout Life) {
        passiveEvent(&life)
        if roll(0.35), let event = socialEvent(for: life) {
            life.pendingEvents.append(event)
        } else if roll(0.5), let event = choiceEvent(for: life) {
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

    // MARK: Events driven by the people in your life

    private static func socialEvent(for life: Life) -> PendingEvent? {
        var events: [PendingEvent] = []
        let alive = life.relationships.filter { $0.isAlive && !$0.isPet }

        for parent in alive where parent.kind.isParent && parent.age >= 68 && life.age >= 18 {
            events.append(PendingEvent(
                kind: .parentNeedsCare(parent.id),
                title: "Family Health Scare",
                message: "Your \(parent.title.lowercased()) \(parent.firstName) (\(parent.age)) is in poor health and needs help.",
                options: ["Move in and care for them", "Send money ($2,000)", "Ignore it"]
            ))
        }
        if let partner = alive.first(where: { $0.kind == .partner }), partner.bond >= 75, partner.yearsTogether >= 2, life.age >= 18 {
            events.append(PendingEvent(
                kind: .partnerProposes(partner.id),
                title: "Will You Marry Me?",
                message: "\(partner.firstName) got down on one knee and proposed to you! 💍",
                options: ["Yes!", "No"]
            ))
        }
        if let partner = alive.first(where: { $0.kind.isRomantic }), partner.bond < 45 || (partner.trait == .toxic && roll(0.5)) {
            events.append(PendingEvent(
                kind: .partnerCheated(partner.id),
                title: "Betrayal",
                message: "You found messages on \(partner.firstName)'s phone. They've been cheating on you.",
                options: ["Forgive them", "Confront them", "End it"]
            ))
        }
        for kid in alive where kid.kind == .child && (13...19).contains(kid.age) && kid.bond < 45 {
            events.append(PendingEvent(
                kind: .childInTrouble(kid.id),
                title: "Trouble at Home",
                message: "Your \(kid.title.lowercased()) \(kid.firstName) (\(kid.age)) was caught \(["shoplifting", "skipping school for a month", "vandalizing the school", "drinking at a party"].randomElement()!).",
                options: ["Have a heart-to-heart", "Ground them", "Let it slide"]
            ))
        }
        for friend in alive where friend.kind == .friend && friend.bond >= 40 && life.age >= 16 {
            let amount = Int.random(in: 200...5_000)
            events.append(PendingEvent(
                kind: .friendNeedsHelp(friend.id, amount: amount),
                title: "A Friend in Need",
                message: "\(friend.firstName) is going through a rough patch and asks to borrow \(formatMoney(amount)).",
                options: ["Help them out", "Say no"]
            ))
        }
        if alive.filter({ $0.kind.isParent || $0.kind == .sibling || $0.kind == .child }).count >= 2 && life.age >= 10 {
            events.append(PendingEvent(
                kind: .familyReunion,
                title: "Family Reunion",
                message: "The whole family is getting together for the holidays.",
                options: ["Go and have fun", "Go and start drama", "Skip it"]
            ))
        }
        return events.randomElement()
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
        if age == 17 {
            var date = Names.person(kind: .partner, age: 17, gender: life.preferredGender, bond: .random(in: 50...80))
            date.money = 0
            events.append(PendingEvent(
                kind: .prom(date),
                title: "Prom Night",
                message: "\(date.fullName) asked you to prom!",
                options: ["Go together", "Go with friends", "Skip prom"]
            ))
        }
        if age >= 18, let sibling = life.relationships.filter({ $0.kind == .sibling && $0.isAlive && $0.age >= 18 }).randomElement() {
            let amount = Int.random(in: 500...10_000)
            events.append(PendingEvent(
                kind: .siblingNeedsMoney(name: sibling.firstName, amount: amount),
                title: "Family Favor",
                message: "Your \(sibling.title.lowercased()) \(sibling.firstName) is broke and asks to borrow \(formatMoney(amount)).",
                options: ["Lend it", "Refuse"]
            ))
        }
        if let addiction = life.addictions.randomElement() {
            events.append(PendingEvent(
                kind: .craving(addiction),
                title: "Craving",
                message: "Your \(addiction.name.lowercased()) is acting up. You feel a powerful urge.",
                options: ["Give in", "Resist"]
            ))
        }
        if age >= 10 {
            events.append(PendingEvent(
                kind: .celebrity,
                title: "Celebrity Sighting",
                message: "You spot a famous movie star at a coffee shop.",
                options: ["Ask for a selfie", "Leave them alone", "Insult them"]
            ))
        }
        if age >= 18 && !life.inPrison {
            events.append(PendingEvent(
                kind: .juryDuty,
                title: "Jury Duty",
                message: "You've been summoned for jury duty.",
                options: ["Serve", "Ignore the summons"]
            ))
        }
        if life.hasDriversLicense && life.assets.contains(where: { $0.kind == .car }) && (life.addictions.contains(.alcohol) || roll(0.3)) {
            events.append(PendingEvent(
                kind: .drunkDriving,
                title: "One Too Many",
                message: "You had a few drinks at a friend's party and your car is parked outside.",
                options: ["Drive home", "Call a cab"]
            ))
        }
        if (16...60).contains(age) && life.romanticPartner == nil {
            let gender = life.preferredGender
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
                bump(.partners)
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

        case .siblingNeedsMoney(let name, let amount):
            if let sibling = relationships.first(where: { $0.firstName == name && $0.kind == .sibling }) {
                if choice == 0 {
                    money -= amount
                    karma += 3
                    updateRelationship(sibling.id) { $0.bond += 15; $0.money += amount }
                    return "I lent \(name) \(formatMoney(amount)). \(sibling.gender.subject.capitalized) was very grateful."
                }
                updateRelationship(sibling.id) { $0.bond -= 12 }
            }
            return "I refused to lend \(name) any money."

        case .prom(let date):
            switch choice {
            case 0:
                relationships.append(date)
                bump(.partners)
                bump(.parties)
                adjust(happiness: 15)
                popularity = min(100, popularity + 8)
                return "I went to prom with \(date.firstName) and we started dating! 💃"
            case 1:
                adjust(happiness: 8)
                bump(.parties)
                return "I went to prom with my friends and had a blast."
            default:
                adjust(happiness: -3)
                return "I skipped prom and stayed home."
            }

        case .craving(let addiction):
            if choice == 0 {
                adjust(happiness: 6, health: -6)
                money -= 500
                return "I gave in to my \(addiction.name.lowercased())."
            }
            if roll(0.3) {
                addictions.removeAll { $0 == addiction }
                adjust(happiness: 10)
                return "I resisted the urge and finally beat my \(addiction.name.lowercased())!"
            }
            adjust(happiness: -3)
            return "I resisted the urge. It wasn't easy."

        case .celebrity:
            switch choice {
            case 0:
                if roll(0.7) {
                    followers += Int.random(in: 50...2_000)
                    adjust(happiness: 8)
                    return "The celebrity happily took a selfie with me. My followers loved it!"
                }
                adjust(happiness: -4)
                return "The celebrity's bodyguard pushed me away."
            case 1:
                return "I let the celebrity enjoy their coffee in peace."
            default:
                karma -= 2
                return "I told the celebrity their last movie was garbage."
            }

        case .juryDuty:
            if choice == 0 {
                karma += 2
                money += 300
                return "I served on a jury and helped reach a verdict."
            }
            if roll(0.3) {
                money -= 1_000
                return "I ignored my jury summons and was fined $1,000."
            }
            return "I ignored my jury summons and nobody noticed."

        case .drunkDriving:
            if choice == 0 {
                karma -= 5
                if roll(0.1) {
                    die(cause: "a drunk-driving crash")
                    return "I crashed my car on the way home."
                }
                if roll(0.25) {
                    criminalRecord.append("DUI")
                    hasDriversLicense = false
                    money -= 5_000
                    return "I was pulled over for drunk driving. I lost my license and paid a $5,000 fine."
                }
                return "I drove home drunk and somehow made it."
            }
            money -= 40
            return "I took a cab home. Better safe than sorry."

        case .parentNeedsCare(let id):
            guard let parent = relationships.first(where: { $0.id == id }) else { return "It turned out to be nothing." }
            touch(id)
            switch choice {
            case 0:
                updateRelationship(id) { $0.bond += 25 }
                karma += 5
                adjust(happiness: -4, health: -3)
                if let current = job, !current.partTime { job?.performance = max(0, current.performance - 10) }
                return "I moved in to care for \(parent.firstName). It was exhausting, but \(parent.gender.subject) was so grateful."
            case 1:
                money -= 2_000
                updateRelationship(id) { $0.bond += 8 }
                return "I sent \(parent.firstName) $2,000 for medical bills."
            default:
                updateRelationship(id) { $0.bond -= 25 }
                karma -= 5
                return "I ignored \(parent.firstName)'s health problems. \(parent.gender.subject.capitalized) won't forget that."
            }

        case .partnerProposes(let id):
            guard let partner = relationships.first(where: { $0.id == id }) else { return "Never mind." }
            touch(id)
            if choice == 0 {
                updateRelationship(id) { $0.kind = .fiance; $0.bond += 15 }
                adjust(happiness: 20)
                return "💍 I said YES to \(partner.firstName)! We're engaged!"
            }
            updateRelationship(id) { $0.bond -= 35 }
            adjust(happiness: -8)
            return "I turned down \(partner.firstName)'s proposal. \(partner.gender.subject.capitalized) was heartbroken."

        case .partnerCheated(let id):
            guard let partner = relationships.first(where: { $0.id == id }) else { return "Never mind." }
            touch(id)
            adjust(happiness: -15)
            switch choice {
            case 0:
                updateRelationship(id) { $0.bond += 10 }
                return "I forgave \(partner.firstName) for cheating. I hope I don't regret it."
            case 1:
                if roll(0.5) {
                    updateRelationship(id) { $0.bond += 15 }
                    return "I confronted \(partner.firstName). \(partner.gender.subject.capitalized) begged for forgiveness and promised to change."
                }
                updateRelationship(id) { $0.bond -= 20 }
                return "I confronted \(partner.firstName) and it turned into a screaming match."
            default:
                relationships.removeAll { $0.id == id }
                if partner.kind == .spouse {
                    let settlement = max(0, money / 3)
                    money -= settlement
                    return "💔 I divorced \(partner.firstName) for cheating. The settlement cost me \(formatMoney(settlement))."
                }
                return "💔 I dumped \(partner.firstName) for cheating on me."
            }

        case .childInTrouble(let id):
            guard let kid = relationships.first(where: { $0.id == id }) else { return "It sorted itself out." }
            touch(id)
            switch choice {
            case 0:
                if roll(0.65) {
                    updateRelationship(id) { $0.bond += 20 }
                    return "I had a long talk with \(kid.firstName). We understand each other much better now."
                }
                updateRelationship(id) { $0.bond -= 5 }
                return "I tried to talk with \(kid.firstName), but \(kid.gender.subject) just rolled \(kid.gender.possessive) eyes and slammed the door."
            case 1:
                updateRelationship(id) { $0.bond -= 8 }
                return "I grounded \(kid.firstName) for a month. \(kid.gender.subject.capitalized) says \(kid.gender.subject) hates me."
            default:
                updateRelationship(id) { $0.bond -= 3 }
                karma -= 2
                return "I let \(kid.firstName)'s behavior slide."
            }

        case .friendNeedsHelp(let id, let amount):
            guard let friend = relationships.first(where: { $0.id == id }) else { return "Never mind." }
            touch(id)
            if choice == 0 {
                money -= amount
                karma += 3
                updateRelationship(id) { $0.bond += 20 }
                if friend.trait == .generous || roll(0.4) {
                    let repaid = amount + amount / 5
                    money += repaid
                    return "I lent \(friend.firstName) \(formatMoney(amount)). \(friend.gender.subject.capitalized) paid me back \(formatMoney(repaid)) with a thank-you card."
                }
                return "I lent \(friend.firstName) \(formatMoney(amount)). I doubt I'll see it again, but our friendship is stronger."
            }
            updateRelationship(id) { $0.bond -= 15 }
            return "I told \(friend.firstName) I couldn't help. Things are awkward between us now."

        case .familyReunion:
            let family = relationships.filter { $0.isAlive && ($0.kind.isParent || $0.kind == .sibling || $0.kind == .child) }
            switch choice {
            case 0:
                for person in family {
                    touch(person.id)
                    updateRelationship(person.id) { $0.bond += .random(in: 3...10) }
                }
                adjust(happiness: 8)
                return "👨‍👩‍👧‍👦 I had a wonderful time catching up with the whole family."
            case 1:
                for person in family {
                    touch(person.id)
                    updateRelationship(person.id) { $0.bond -= .random(in: 5...15) }
                }
                adjust(happiness: 3)
                karma -= 2
                return "🍿 I brought up old grudges at dinner and the reunion descended into chaos."
            default:
                for person in family {
                    updateRelationship(person.id) { $0.bond -= .random(in: 1...5) }
                }
                return "I skipped the family reunion. Nobody was thrilled about it."
            }
        }
    }
}
