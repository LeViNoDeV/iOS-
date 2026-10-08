import Foundation

// MARK: - Activities

enum Activity: String, CaseIterable, Identifiable {
    case gym, library, meditate, doctor, walk
    case party, vacation, plasticSurgery
    case lottery, casino

    var id: String { rawValue }

    var title: String {
        switch self {
        case .gym: return "Gym"
        case .library: return "Library"
        case .meditate: return "Meditate"
        case .doctor: return "Doctor"
        case .walk: return "Go for a Walk"
        case .party: return "Night Club"
        case .vacation: return "Vacation"
        case .plasticSurgery: return "Plastic Surgery"
        case .lottery: return "Lottery"
        case .casino: return "Casino"
        }
    }

    var emoji: String {
        switch self {
        case .gym: return "🏋️"
        case .library: return "📚"
        case .meditate: return "🧘"
        case .doctor: return "🩺"
        case .walk: return "🚶"
        case .party: return "🪩"
        case .vacation: return "🏖️"
        case .plasticSurgery: return "💉"
        case .lottery: return "🎟️"
        case .casino: return "🎰"
        }
    }

    var subtitle: String {
        switch self {
        case .gym: return "Get in shape"
        case .library: return "Read some books"
        case .meditate: return "Find inner peace"
        case .doctor: return "Get a checkup · $200"
        case .walk: return "Fresh air"
        case .party: return "Dance the night away · $100"
        case .vacation: return "Get away · $3,000"
        case .plasticSurgery: return "Change your look · $10,000"
        case .lottery: return "Buy a ticket · $20"
        case .casino: return "Bet $1,000 on blackjack"
        }
    }

    var minAge: Int {
        switch self {
        case .walk, .doctor: return 4
        case .library, .meditate: return 6
        case .gym: return 12
        case .party, .vacation, .plasticSurgery, .lottery, .casino: return 18
        }
    }
}

enum Crime: String, CaseIterable, Identifiable {
    case shoplift, pickpocket, burglary, carTheft, bankRobbery

    var id: String { rawValue }

    var title: String {
        switch self {
        case .shoplift: return "Shoplift"
        case .pickpocket: return "Pickpocket"
        case .burglary: return "Burglary"
        case .carTheft: return "Grand Theft Auto"
        case .bankRobbery: return "Rob a Bank"
        }
    }

    var emoji: String {
        switch self {
        case .shoplift: return "🛍️"
        case .pickpocket: return "👛"
        case .burglary: return "🏚️"
        case .carTheft: return "🚙"
        case .bankRobbery: return "🏦"
        }
    }

    var minAge: Int { self == .bankRobbery || self == .carTheft ? 16 : 10 }
    var catchChance: Double {
        switch self {
        case .shoplift: return 0.25
        case .pickpocket: return 0.3
        case .burglary: return 0.35
        case .carTheft: return 0.4
        case .bankRobbery: return 0.6
        }
    }
    var loot: ClosedRange<Int> {
        switch self {
        case .shoplift: return 20...300
        case .pickpocket: return 10...800
        case .burglary: return 500...15_000
        case .carTheft: return 3_000...40_000
        case .bankRobbery: return 50_000...2_000_000
        }
    }
    var sentence: ClosedRange<Int> {
        switch self {
        case .shoplift: return 1...1
        case .pickpocket: return 1...2
        case .burglary: return 2...5
        case .carTheft: return 3...8
        case .bankRobbery: return 10...30
        }
    }
}

enum PrisonAction: String, CaseIterable, Identifiable {
    case workout, study, riot, escape

    var id: String { rawValue }
    var title: String {
        switch self {
        case .workout: return "Work Out in the Yard"
        case .study: return "Study in the Prison Library"
        case .riot: return "Start a Riot"
        case .escape: return "Attempt an Escape"
        }
    }
    var emoji: String {
        switch self {
        case .workout: return "💪"
        case .study: return "📖"
        case .riot: return "🔥"
        case .escape: return "🏃"
        }
    }
}

enum RelationshipAction: String, CaseIterable, Identifiable {
    case spendTime, conversation, compliment, gift, askForMoney, argue
    case propose, marry, haveBaby, breakUp, play, walkPet

    var id: String { rawValue }
    var title: String {
        switch self {
        case .spendTime: return "Spend Time"
        case .conversation: return "Have a Conversation"
        case .compliment: return "Compliment"
        case .gift: return "Give a Gift ($100)"
        case .askForMoney: return "Ask for Money"
        case .argue: return "Argue"
        case .propose: return "Propose 💍"
        case .marry: return "Get Married 💒"
        case .haveBaby: return "Try for a Baby 👶"
        case .breakUp: return "Break Up"
        case .play: return "Play"
        case .walkPet: return "Go for a Walk"
        }
    }
}

extension Life {
    // MARK: Activities

    func canDo(_ activity: Activity) -> Bool { age >= activity.minAge && !inPrison }

    mutating func perform(_ activity: Activity) -> Outcome {
        let message: String
        switch activity {
        case .gym:
            let gain = Int.random(in: 1...6)
            adjust(happiness: 2, health: gain, looks: Int.random(in: 0...3))
            message = "I had a great workout at the gym. Health +\(gain)."
        case .library:
            let gain = Int.random(in: 1...5)
            adjust(happiness: 1, smarts: gain)
            message = "I read a fascinating book at the library. Smarts +\(gain)."
        case .meditate:
            let gain = Int.random(in: 2...7)
            adjust(happiness: gain, health: 1)
            message = "I meditated and found some inner peace. Happiness +\(gain)."
        case .walk:
            adjust(happiness: 2, health: 1)
            message = "I went for a relaxing walk around \(city)."
        case .doctor:
            money -= 200
            let gain = Int.random(in: 5...15)
            adjust(health: gain)
            message = "The doctor gave me a checkup and some medicine. Health +\(gain)."
        case .party:
            money -= 100
            if roll(0.15) {
                adjust(happiness: 5, health: -8)
                message = "I partied too hard and woke up with a terrible hangover."
            } else {
                adjust(happiness: Int.random(in: 6...12))
                message = "I danced the night away at the club!"
            }
        case .vacation:
            money -= 3_000
            let place = Names.places.randomElement()!
            adjust(happiness: Int.random(in: 12...25), health: 3)
            message = "I took a relaxing vacation to \(place.0), \(place.1)."
        case .plasticSurgery:
            money -= 10_000
            if roll(0.2) {
                adjust(happiness: -20, looks: -Int.random(in: 10...30))
                message = "The surgery was botched! I look worse than before."
            } else {
                let gain = Int.random(in: 8...25)
                adjust(happiness: 10, looks: gain)
                message = "The surgery was a success. Looks +\(gain)."
            }
        case .lottery:
            money -= 20
            if roll(0.0005) {
                let jackpot = Int.random(in: 5_000_000...150_000_000)
                money += jackpot
                adjust(happiness: 50)
                message = "🎉 I WON THE LOTTERY JACKPOT: \(formatMoney(jackpot))!"
            } else if roll(0.03) {
                money += 1_000
                adjust(happiness: 8)
                message = "I matched a few numbers and won $1,000!"
            } else {
                message = "My lottery ticket was a dud."
            }
        case .casino:
            if roll(0.46) {
                money += 1_000
                adjust(happiness: 10)
                message = "I won $1,000 at blackjack!"
            } else {
                money -= 1_000
                adjust(happiness: -6)
                message = "I lost $1,000 at blackjack."
            }
        }
        record(message)
        return Outcome(title: activity.title, message: message)
    }

    // MARK: Crime

    mutating func commit(_ crime: Crime) -> Outcome {
        karma -= 5
        if roll(crime.catchChance) {
            let years = Int.random(in: crime.sentence)
            criminalRecord.append(crime.title)
            if age < 18 {
                adjust(happiness: -10)
                let message = "I was caught trying to \(crime.title.lowercased()). Since I'm a minor, I got off with a warning and my parents grounded me."
                record(message)
                return Outcome(title: "Busted!", message: message)
            }
            sendToPrison(years: years)
            let message = "🚔 I was caught committing \(crime.title.lowercased()) and sentenced to \(years) year\(years == 1 ? "" : "s") in prison."
            record(message)
            return Outcome(title: "Busted!", message: message)
        }
        let loot = Int.random(in: crime.loot)
        money += loot
        adjust(happiness: 4)
        let message = "I got away with it! I made \(formatMoney(loot)) from a \(crime.title.lowercased())."
        record(message)
        return Outcome(title: "Success", message: message)
    }

    mutating func sendToPrison(years: Int) {
        prisonYearsLeft = max(prisonYearsLeft, years)
        if let current = job {
            record("I lost my job as a \(current.title).")
            job = nil
        }
        if enrollment != nil {
            record("I was expelled from school.")
            enrollment = nil
        }
        adjust(happiness: -25)
    }

    mutating func perform(_ action: PrisonAction) -> Outcome {
        let message: String
        switch action {
        case .workout:
            adjust(health: .random(in: 2...6), looks: .random(in: 0...2))
            message = "I lifted weights in the prison yard."
        case .study:
            adjust(smarts: .random(in: 2...5))
            message = "I read some books in the prison library."
        case .riot:
            if roll(0.3) {
                prisonYearsLeft += 2
                adjust(health: -15)
                message = "The riot failed. The guards beat me and added 2 years to my sentence."
            } else {
                adjust(happiness: 6, health: -5)
                message = "I started a riot! It was chaos, but I wasn't blamed."
            }
        case .escape:
            if roll(0.15) {
                prisonYearsLeft = 0
                criminalRecord.append("Prison Escape")
                adjust(happiness: 25)
                message = "🏃 I escaped from prison! I'm a free person... for now."
            } else {
                prisonYearsLeft += 3
                adjust(happiness: -10)
                message = "My escape attempt failed. 3 years were added to my sentence."
            }
        }
        record(message)
        return Outcome(title: action.title, message: message)
    }

    // MARK: School

    var canStudyHarder: Bool { inGradeSchool || enrollment != nil }

    mutating func studyHarder() -> Outcome {
        if enrollment != nil {
            let grades = enrollment?.grades ?? 50
            enrollment?.grades = min(100, grades + .random(in: 3...8))
        } else {
            schoolGrades = min(100, schoolGrades + .random(in: 3...8))
        }
        adjust(happiness: -2, smarts: .random(in: 1...3))
        let message = "I studied harder at school."
        record(message)
        return Outcome(title: "School", message: message)
    }

    mutating func dropOut() -> Outcome {
        let message: String
        if let enrolled = enrollment {
            enrollment = nil
            message = "I dropped out of \(enrolled.kind.name)."
        } else {
            droppedOut = true
            message = "I dropped out of high school."
        }
        adjust(happiness: -5)
        record(message)
        return Outcome(title: "Dropped Out", message: message)
    }

    var canEnrollInUniversity: Bool {
        age >= 18 && education >= .highSchool && education < .bachelor && enrollment == nil && !inPrison
    }

    mutating func enrollUniversity(major: String) -> Outcome {
        let parentsPay = relationships.contains { $0.kind.isParent && $0.isAlive && $0.money > universityTuitionPerYear * 4 } && roll(0.6)
        if !parentsPay { studentLoans += universityTuitionPerYear * 4 }
        enrollment = Enrollment(kind: .university(major: major), yearsLeft: 4, grades: schoolGrades)
        if let current = job, !current.partTime { job = nil }
        let funding = parentsPay ? "My parents are paying for it!" : "I took out \(formatMoney(universityTuitionPerYear * 4)) in student loans."
        let message = "I enrolled at university to study \(major). \(funding)"
        record(message)
        adjust(happiness: 8)
        return Outcome(title: "University", message: message)
    }

    func canEnrollGraduate(_ field: GraduateField) -> Bool {
        education >= .bachelor && enrollment == nil && !graduateDegrees.contains(field) && !inPrison
    }

    mutating func enrollGraduate(_ field: GraduateField) -> Outcome {
        guard stats.smarts >= 45 || roll(0.3) else {
            let message = "I was rejected from \(field.schoolName). Maybe I should hit the books."
            record(message)
            adjust(happiness: -8)
            return Outcome(title: "Rejected", message: message)
        }
        let cost = field.tuitionPerYear * field.years
        studentLoans += cost
        enrollment = Enrollment(kind: .graduate(field), yearsLeft: field.years, grades: 60)
        if let current = job, !current.partTime { job = nil }
        let message = "I was accepted to \(field.schoolName)! I took out \(formatMoney(cost)) in loans."
        record(message)
        adjust(happiness: 10)
        return Outcome(title: field.schoolName, message: message)
    }

    // MARK: Jobs

    func meetsRequirements(_ template: JobTemplate) -> Bool {
        guard age >= template.minAge, !inPrison else { return false }
        if template.partTime {
            return age < 18 || enrollment != nil || job == nil
        }
        if age < 18 { return false }
        if education < template.requiredEducation { return false }
        if let field = template.requiredField, !graduateDegrees.contains(field) { return false }
        if let required = template.requiredMajor, major != required { return false }
        return true
    }

    func jobListings() -> [JobOpening] {
        jobCatalog
            .filter { $0.minAge <= max(age, 14) && (age >= 18 || $0.partTime) }
            .map { template in
                let salary = Int(Double(template.baseSalary) * Double.random(in: 0.85...1.2)) / 100 * 100
                return JobOpening(template: template, company: companyNames.randomElement()!, salary: salary)
            }
    }

    mutating func apply(to opening: JobOpening) -> Outcome {
        let template = opening.template
        let company = opening.company
        let salary = opening.salary
        guard meetsRequirements(template) else {
            return Outcome(title: "Not Qualified", message: "I don't meet the requirements for \(template.title): \(template.requirementText).")
        }
        var chance = 0.55 + Double(stats.smarts - template.minSmarts) / 200
        if stats.smarts < template.minSmarts { chance -= 0.3 }
        if stats.looks < template.minLooks { chance = 0.02 }
        if !criminalRecord.isEmpty && !template.partTime { chance -= 0.2 }
        guard roll(chance.clamped(to: 0.05...0.95)) else {
            let message = "I interviewed for the \(template.title) position at \(company), but they didn't hire me."
            record(message)
            adjust(happiness: -3)
            return Outcome(title: "Rejected", message: message)
        }
        if let current = job { record("I quit my job as a \(current.title).") }
        job = Job(templateID: template.id, title: template.title, company: company, salary: salary, partTime: template.partTime)
        isRetired = false
        let message = "🎉 I got hired as a \(template.title) at \(company) for \(formatMoney(salary))/yr!"
        record(message)
        adjust(happiness: 10)
        return Outcome(title: "Hired!", message: message)
    }

    mutating func workHarder() -> Outcome {
        let performance = job?.performance ?? 50
        job?.performance = min(100, performance + .random(in: 4...10))
        adjust(happiness: -2, health: -1)
        let message = "I worked extra hard at my job."
        record(message)
        return Outcome(title: "Work", message: message)
    }

    mutating func askForRaise() -> Outcome {
        guard var current = job else { return Outcome(title: "Raise", message: "I don't have a job.") }
        let message: String
        if roll(Double(current.performance) / 130) {
            let raise = Int(Double(current.salary) * Double.random(in: 0.05...0.12))
            current.salary += raise
            message = "My boss gave me a \(formatMoney(raise)) raise!"
            adjust(happiness: 8)
        } else {
            current.performance -= 8
            message = "My boss laughed at my request for a raise."
            adjust(happiness: -5)
        }
        job = current
        record(message)
        return Outcome(title: "Raise", message: message)
    }

    mutating func quitJob() -> Outcome {
        guard let current = job else { return Outcome(title: "Quit", message: "I don't have a job.") }
        job = nil
        let message = "I quit my job as a \(current.title) at \(current.company)."
        record(message)
        return Outcome(title: "Quit", message: message)
    }

    var canRetire: Bool { age >= 60 && job != nil && !(job?.partTime ?? true) }

    mutating func retire() -> Outcome {
        guard let current = job else { return Outcome(title: "Retire", message: "I don't have a job.") }
        pension = Int(Double(current.salary) * min(0.6, 0.02 * Double(current.years)))
        job = nil
        isRetired = true
        adjust(happiness: 15)
        let message = "🎉 I retired from my career as a \(current.title). My pension is \(formatMoney(pension))/yr."
        record(message)
        return Outcome(title: "Retired", message: message)
    }

    // MARK: Relationships

    func actions(for person: Relationship) -> [RelationshipAction] {
        guard person.isAlive, !inPrison else { return [] }
        if person.kind == .pet { return [.play, .walkPet] }
        var list: [RelationshipAction] = [.spendTime, .conversation, .compliment]
        if age >= 10 { list.append(.gift) }
        if person.kind.isParent || person.kind.isRomantic { list.append(.askForMoney) }
        list.append(.argue)
        switch person.kind {
        case .partner:
            if age >= 18 { list.append(.propose) }
            list.append(.breakUp)
            if age >= 18 { list.append(.haveBaby) }
        case .fiance:
            list += [.marry, .haveBaby, .breakUp]
        case .spouse:
            list += [.haveBaby, .breakUp]
        default:
            break
        }
        return list
    }

    mutating func perform(_ action: RelationshipAction, with id: UUID) -> Outcome {
        guard let person = relationships.first(where: { $0.id == id }) else {
            return Outcome(title: "Oops", message: "That person is no longer in my life.")
        }
        let name = person.firstName
        var message: String

        switch action {
        case .spendTime:
            updateRelationship(id) { $0.bond += .random(in: 3...10) }
            adjust(happiness: 4)
            message = "I spent quality time with my \(person.title.lowercased()) \(name)."
        case .conversation:
            if roll(0.85) {
                updateRelationship(id) { $0.bond += .random(in: 2...6) }
                message = "I had a nice conversation with \(name)."
            } else {
                updateRelationship(id) { $0.bond -= 4 }
                message = "My conversation with \(name) turned into an awkward silence."
            }
        case .compliment:
            updateRelationship(id) { $0.bond += .random(in: 1...5) }
            message = "I told \(name) \(["they look great", "they're really smart", "they have a great laugh", "I admire them"].randomElement()!)."
        case .gift:
            money -= 100
            updateRelationship(id) { $0.bond += .random(in: 5...12) }
            message = "I gave \(name) a thoughtful gift. \(person.gender.subject.capitalized) loved it!"
        case .askForMoney:
            let chance = Double(person.bond) / 140
            if person.money > 100 && roll(chance) {
                let amount = min(person.money, Int.random(in: 10...max(11, person.money / 20)))
                money += amount
                updateRelationship(id) { $0.money -= amount; $0.bond -= 2 }
                message = "\(name) gave me \(formatMoney(amount))."
            } else {
                updateRelationship(id) { $0.bond -= 5 }
                message = "\(name) refused to give me any money."
            }
        case .argue:
            updateRelationship(id) { $0.bond -= .random(in: 5...15) }
            adjust(happiness: -3)
            message = "I got into a heated argument with \(name) about \(["politics", "money", "chores", "the past", "nothing in particular"].randomElement()!)."
        case .propose:
            if roll(Double(person.bond) / 110) {
                updateRelationship(id) { $0.kind = .fiance; $0.bond += 10 }
                adjust(happiness: 15)
                message = "💍 I proposed to \(name) and \(person.gender.subject) said YES!"
            } else {
                updateRelationship(id) { $0.bond -= 15 }
                adjust(happiness: -15)
                message = "I proposed to \(name), but \(person.gender.subject) said no."
            }
        case .marry:
            let cost = Int.random(in: 5_000...30_000)
            money -= cost
            updateRelationship(id) { $0.kind = .spouse; $0.bond += 10 }
            adjust(happiness: 20)
            message = "💒 I married \(name) in a beautiful \(formatMoney(cost)) ceremony!"
        case .haveBaby:
            if age > 50 || person.age > 50 || !roll(0.55) {
                message = "We tried for a baby, but it didn't happen this time."
            } else {
                let gender = Gender.allCases.randomElement()!
                let babyName = Names.first(for: gender)
                let baby = Relationship(kind: .child, firstName: babyName, lastName: lastName, gender: gender, age: 0, bond: 100)
                relationships.append(baby)
                updateRelationship(id) { $0.bond += 5 }
                adjust(happiness: 15)
                message = "👶 We welcomed a baby \(gender == .male ? "boy" : "girl") named \(babyName)!"
            }
        case .breakUp:
            relationships.removeAll { $0.id == id }
            adjust(happiness: -10)
            if person.kind == .spouse {
                let settlement = max(0, money / 2)
                money -= settlement
                message = "I divorced \(name). The settlement cost me \(formatMoney(settlement))."
            } else {
                message = "I broke up with \(name)."
            }
        case .play:
            updateRelationship(id) { $0.bond += .random(in: 4...10) }
            adjust(happiness: 5)
            message = "I played with \(name). \(person.species == "Cat" ? "Purrr!" : "So much fun!")"
        case .walkPet:
            updateRelationship(id) { $0.bond += .random(in: 3...8) }
            adjust(happiness: 3, health: 2)
            message = "I took \(name) for a walk."
        }
        record(message)
        return Outcome(title: person.fullName, message: message)
    }

    var canFindDate: Bool { age >= 16 && romanticPartner == nil && !inPrison }

    mutating func findDate() -> Outcome {
        let gender: Gender = self.gender == .male ? .female : .male
        let odds = 0.35 + Double(stats.looks) / 200
        guard roll(odds) else {
            let message = "I went looking for love, but struck out."
            record(message)
            adjust(happiness: -3)
            return Outcome(title: "Dating", message: message)
        }
        let person = Names.person(kind: .partner, age: max(16, age + .random(in: -5...5)), gender: gender, bond: .random(in: 50...80))
        relationships.append(person)
        adjust(happiness: 10)
        let message = "❤️ I met \(person.fullName) (\(person.age)) and we started dating!"
        record(message)
        return Outcome(title: "Dating", message: message)
    }

    mutating func makeFriend() -> Outcome {
        let friend = Names.person(kind: .friend, age: max(5, age + .random(in: -3...3)), bond: .random(in: 40...70))
        relationships.append(friend)
        adjust(happiness: 4)
        let message = "I made a new friend named \(friend.fullName)."
        record(message)
        return Outcome(title: "New Friend", message: message)
    }

    // MARK: Assets

    static func marketListings(kind: AssetKind) -> [AssetListing] {
        let source = kind == .house ? Names.houses : Names.cars
        return source.map { item in
            let price = Int(Double(item.1) * Double.random(in: 0.85...1.2)) / 100 * 100
            return AssetListing(kind: kind, name: item.0, price: price)
        }
    }

    mutating func buy(_ listing: AssetListing) -> Outcome {
        guard age >= 18 else { return Outcome(title: "Too Young", message: "I'm too young to buy that.") }
        guard money >= listing.price else {
            return Outcome(title: "Can't Afford", message: "I can't afford the \(listing.name). I need \(formatMoney(listing.price)).")
        }
        money -= listing.price
        assets.append(Asset(kind: listing.kind, name: listing.name, purchasePrice: listing.price, value: listing.price))
        adjust(happiness: 10)
        let message = "I bought a \(listing.name) for \(formatMoney(listing.price))!"
        record(message)
        return Outcome(title: "Purchased", message: message)
    }

    mutating func sell(_ assetID: UUID) -> Outcome {
        guard let index = assets.firstIndex(where: { $0.id == assetID }) else {
            return Outcome(title: "Oops", message: "I don't own that anymore.")
        }
        let asset = assets.remove(at: index)
        money += asset.value
        let message = "I sold my \(asset.name) for \(formatMoney(asset.value))."
        record(message)
        return Outcome(title: "Sold", message: message)
    }
}
