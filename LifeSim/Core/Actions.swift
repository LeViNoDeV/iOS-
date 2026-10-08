import Foundation

// MARK: - Activities

enum Activity: String, CaseIterable, Identifiable {
    case gym, library, meditate, walk, martialArts, salon, diet
    case party, bar, drugs
    case movies, concert, vacation, plasticSurgery, lottery

    var id: String { rawValue }

    private var info: (title: String, emoji: String, subtitle: String, minAge: Int) {
        switch self {
        case .gym: return ("Gym", "🏋️", "Get in shape", 12)
        case .library: return ("Library", "📚", "Read some books", 6)
        case .meditate: return ("Meditate", "🧘", "Find inner peace", 6)
        case .walk: return ("Go for a Walk", "🚶", "Fresh air", 4)
        case .martialArts: return ("Martial Arts", "🥋", "Learn to fight · $150", 6)
        case .salon: return ("Salon & Spa", "💅", "Pamper yourself · $250", 12)
        case .diet: return ("Go on a Diet", "🥗", "Eat healthier", 12)
        case .party: return ("Night Club", "🪩", "Dance the night away · $100", 18)
        case .bar: return ("Go to a Bar", "🍺", "Have a few drinks · $60", 18)
        case .drugs: return ("Do Drugs", "💊", "A dangerous high", 14)
        case .movies: return ("Movie Theater", "🎬", "Catch a film · $15", 5)
        case .concert: return ("Concert", "🎤", "See a live show · $120", 12)
        case .vacation: return ("Vacation", "🏖️", "Get away · $3,000", 18)
        case .plasticSurgery: return ("Plastic Surgery", "💉", "Change your look · $10,000", 18)
        case .lottery: return ("Lottery", "🎟️", "Buy a ticket · $20", 18)
        }
    }

    var title: String { info.title }
    var emoji: String { info.emoji }
    var subtitle: String { info.subtitle }
    var minAge: Int { info.minAge }

    static let mindAndBody: [Activity] = [.gym, .library, .meditate, .walk, .martialArts, .salon, .diet]
    static let nightlife: [Activity] = [.party, .bar, .drugs]
    static let leisure: [Activity] = [.movies, .concert, .vacation, .plasticSurgery, .lottery]
}

enum CasinoGame: String, CaseIterable, Identifiable {
    case blackjack, roulette, slots, horseRacing

    var id: String { rawValue }
    var title: String {
        switch self {
        case .blackjack: return "Blackjack"
        case .roulette: return "Roulette"
        case .slots: return "Slot Machines"
        case .horseRacing: return "Horse Racing"
        }
    }
    var emoji: String {
        switch self {
        case .blackjack: return "🃏"
        case .roulette: return "🎡"
        case .slots: return "🎰"
        case .horseRacing: return "🏇"
        }
    }
    /// (chance to win, payout multiplier)
    var odds: (Double, Int) {
        switch self {
        case .blackjack: return (0.46, 2)
        case .roulette: return (0.18, 6)
        case .slots: return (0.05, 15)
        case .horseRacing: return (0.12, 8)
        }
    }

    static let bets = [100, 1_000, 10_000, 100_000]
}

enum Crime: String, CaseIterable, Identifiable {
    case shoplift, porchPirate, pickpocket, burglary, extortion, carTheft, trainRobbery, bankRobbery

    var id: String { rawValue }

    private var info: (title: String, emoji: String, minAge: Int, catchChance: Double, loot: ClosedRange<Int>, sentence: ClosedRange<Int>) {
        switch self {
        case .shoplift: return ("Shoplift", "🛍️", 10, 0.25, 20...300, 1...1)
        case .porchPirate: return ("Porch Pirate", "📦", 10, 0.2, 20...600, 1...1)
        case .pickpocket: return ("Pickpocket", "👛", 10, 0.3, 10...800, 1...2)
        case .burglary: return ("Burglary", "🏚️", 14, 0.35, 500...15_000, 2...5)
        case .extortion: return ("Extortion", "✉️", 18, 0.4, 2_000...50_000, 2...6)
        case .carTheft: return ("Grand Theft Auto", "🚙", 16, 0.4, 3_000...40_000, 3...8)
        case .trainRobbery: return ("Train Robbery", "🚂", 18, 0.5, 10_000...300_000, 5...15)
        case .bankRobbery: return ("Rob a Bank", "🏦", 18, 0.6, 50_000...2_000_000, 10...30)
        }
    }

    var title: String { info.title }
    var emoji: String { info.emoji }
    var minAge: Int { info.minAge }
    var catchChance: Double { info.catchChance }
    var loot: ClosedRange<Int> { info.loot }
    var sentence: ClosedRange<Int> { info.sentence }
}

enum PrisonAction: String, CaseIterable, Identifiable {
    case workout, study, appeal, bribe, riot, escape

    var id: String { rawValue }
    var title: String {
        switch self {
        case .workout: return "Work Out in the Yard"
        case .study: return "Study in the Prison Library"
        case .appeal: return "Appeal My Sentence ($5,000)"
        case .bribe: return "Bribe the Warden ($25,000)"
        case .riot: return "Start a Riot"
        case .escape: return "Attempt an Escape"
        }
    }
    var emoji: String {
        switch self {
        case .workout: return "💪"
        case .study: return "📖"
        case .appeal: return "⚖️"
        case .bribe: return "💵"
        case .riot: return "🔥"
        case .escape: return "🏃"
        }
    }
}

enum RelationshipAction: String, CaseIterable, Identifiable {
    case spendTime, conversation, compliment, gift, askForMoney, argue
    case propose, marry, haveBaby, breakUp, play, walkPet
    case insult, prank, assault, murder

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
        case .insult: return "Insult"
        case .prank: return "Prank"
        case .assault: return "Assault 👊"
        case .murder: return "Murder 🔪"
        }
    }

    var isHostile: Bool {
        switch self {
        case .argue, .breakUp, .insult, .prank, .assault, .murder: return true
        default: return false
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
            bump(.gym)
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
        case .martialArts:
            money -= 150
            if roll(0.1) {
                adjust(health: -8)
                message = "I got hurt sparring at my martial arts class."
            } else {
                adjust(happiness: 3, health: Int.random(in: 2...5))
                message = "I trained hard at my \(["karate", "judo", "kung fu", "taekwondo", "jiu-jitsu"].randomElement()!) class."
            }
        case .salon:
            money -= 250
            adjust(happiness: 6, looks: Int.random(in: 1...4))
            message = "I got pampered at the salon and spa. I look fabulous."
        case .diet:
            let diet = ["keto", "vegan", "Mediterranean", "paleo", "intermittent fasting"].randomElement()!
            if roll(0.7) {
                adjust(health: Int.random(in: 2...6), looks: Int.random(in: 0...3))
                message = "I stuck to a \(diet) diet and feel great."
            } else {
                adjust(happiness: -3)
                message = "I tried a \(diet) diet but gave up after a week."
            }
        case .party:
            money -= 100
            bump(.parties)
            if roll(0.15) {
                adjust(happiness: 5, health: -8)
                message = "I partied too hard and woke up with a terrible hangover."
            } else {
                adjust(happiness: Int.random(in: 6...12))
                message = "I danced the night away at the club!"
            }
        case .bar:
            money -= 60
            bump(.parties)
            adjust(happiness: Int.random(in: 3...8), health: -2)
            var text = "I had a few drinks at a local bar."
            if !addictions.contains(.alcohol) && roll(0.08) {
                addictions.append(.alcohol)
                text += " I think I'm developing a drinking problem."
            }
            message = text
        case .drugs:
            money -= 100
            if roll(0.04) {
                die(cause: "a drug overdose")
                message = "I overdosed."
            } else {
                adjust(happiness: Int.random(in: 8...15), health: -Int.random(in: 5...12), smarts: -2)
                var text = "I got high on \(["ecstasy", "cocaine", "mushrooms", "pills"].randomElement()!)."
                if !addictions.contains(.drugs) && roll(0.25) {
                    addictions.append(.drugs)
                    text += " I'm hooked."
                }
                message = text
            }
        case .movies:
            money -= 15
            adjust(happiness: Int.random(in: 3...7))
            message = "I watched \(["an action movie", "a romantic comedy", "a horror film", "an animated movie", "a documentary"].randomElement()!) at the movie theater."
        case .concert:
            money -= 120
            adjust(happiness: Int.random(in: 6...12))
            message = "I went to an amazing \(["rock", "pop", "hip-hop", "jazz", "country"].randomElement()!) concert."
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
                bump(.lotteryWins)
                adjust(happiness: 50)
                message = "🎉 I WON THE LOTTERY JACKPOT: \(formatMoney(jackpot))!"
            } else if roll(0.03) {
                money += 1_000
                adjust(happiness: 8)
                message = "I matched a few numbers and won $1,000!"
            } else {
                message = "My lottery ticket was a dud."
            }
        }
        record(message)
        return Outcome(title: activity.title, message: message)
    }

    mutating func gamble(_ game: CasinoGame, bet: Int) -> Outcome {
        guard money >= bet else {
            return Outcome(title: game.title, message: "I don't have \(formatMoney(bet)) to bet.")
        }
        let (chance, multiplier) = game.odds
        let message: String
        if roll(chance) {
            let winnings = bet * (multiplier - 1)
            money += winnings
            adjust(happiness: 12)
            message = "\(game.emoji) I bet \(formatMoney(bet)) on \(game.title.lowercased()) and WON \(formatMoney(winnings))!"
        } else {
            money -= bet
            adjust(happiness: -8)
            message = "\(game.emoji) I bet \(formatMoney(bet)) on \(game.title.lowercased()) and lost it all."
        }
        var text = message
        if !addictions.contains(.gambling) && roll(0.05) {
            addictions.append(.gambling)
            text += " I can't stop thinking about my next bet..."
        }
        record(text)
        return Outcome(title: game.title, message: text)
    }

    // MARK: Crime

    mutating func commit(_ crime: Crime) -> Outcome {
        karma -= 5
        bump(.crimes)
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
        case .appeal:
            money -= 5_000
            if roll(0.2) {
                prisonYearsLeft = 0
                adjust(happiness: 25)
                message = "⚖️ My lawyer won the appeal! I'm a free person."
            } else {
                adjust(happiness: -5)
                message = "My appeal was denied."
            }
        case .bribe:
            guard money >= 25_000 else {
                return Outcome(title: action.title, message: "I don't have enough money to bribe the warden.")
            }
            money -= 25_000
            if roll(0.35) {
                prisonYearsLeft = 0
                adjust(happiness: 25)
                message = "💵 The warden took my bribe and quietly released me."
            } else {
                prisonYearsLeft += 2
                message = "The warden took my money AND reported me. 2 years were added to my sentence."
            }
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
        if age < 18 || age > template.maxAge || stats.health < template.minHealth { return false }
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
        if !criminalRecord.isEmpty && !template.partTime && !template.famous { chance -= 0.2 }
        if template.famous { chance = 0.15 + Double(stats.looks + stats.smarts) / 400 + Double(fame) / 200 }
        if template.military { chance = 0.85 }
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
        list += [.argue, .insult]
        if age >= 6 { list.append(.prank) }
        if age >= 14 { list.append(.assault) }
        if age >= 16 { list.append(.murder) }
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
        case .insult:
            updateRelationship(id) { $0.bond -= .random(in: 6...14) }
            karma -= 1
            message = "I called \(name) \(["a loser", "ugly", "a waste of space", "boring", "a clown"].randomElement()!)."
        case .prank:
            if roll(0.6) {
                updateRelationship(id) { $0.bond += 2 }
                adjust(happiness: 5)
                message = "I pranked \(name) and we both laughed about it."
            } else {
                updateRelationship(id) { $0.bond -= 10 }
                message = "I pranked \(name). \(person.gender.subject.capitalized) did NOT find it funny."
            }
        case .assault:
            karma -= 8
            bump(.crimes)
            updateRelationship(id) { $0.bond -= 40 }
            if roll(0.35) && age >= 18 {
                criminalRecord.append("Assault")
                sendToPrison(years: .random(in: 1...3))
                message = "I attacked \(name). \(person.gender.subject.capitalized) pressed charges and I was sent to prison for \(prisonYearsLeft) year(s)."
            } else {
                adjust(health: -Int.random(in: 0...8))
                message = "I got into a fistfight with \(name) and beat \(person.gender.object) up."
            }
        case .murder:
            karma -= 40
            bump(.crimes)
            if roll(0.55) {
                bump(.murders)
                updateRelationship(id) { $0.isAlive = false }
                if roll(0.45) {
                    criminalRecord.append("Murder")
                    sendToPrison(years: .random(in: 25...60))
                    message = "🔪 I murdered \(name). The police caught me and I was sentenced to \(prisonYearsLeft) years in prison."
                } else {
                    message = "🔪 I murdered \(name) and got away with it... for now."
                }
            } else {
                updateRelationship(id) { $0.bond = 0 }
                if roll(0.5) && age >= 18 {
                    criminalRecord.append("Attempted Murder")
                    sendToPrison(years: .random(in: 8...20))
                    message = "I tried to kill \(name) but failed. I was sentenced to \(prisonYearsLeft) years for attempted murder."
                } else {
                    message = "I tried to kill \(name) but \(person.gender.subject) escaped."
                }
            }
        }
        record(message)
        return Outcome(title: person.fullName, message: message)
    }

    var canFindDate: Bool { age >= 16 && romanticPartner == nil && !inPrison }

    mutating func findDate(gender: Gender? = nil) -> Outcome {
        if let gender = gender { datingPreference = gender }
        let gender = preferredGender
        let odds = 0.35 + Double(stats.looks) / 200
        guard roll(odds) else {
            let message = "I went looking for love, but struck out."
            record(message)
            adjust(happiness: -3)
            return Outcome(title: "Dating", message: message)
        }
        let person = Names.person(kind: .partner, age: max(16, age + .random(in: -5...5)), gender: gender, bond: .random(in: 50...80))
        relationships.append(person)
        bump(.partners)
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
        let source: [(String, Int)]
        switch kind {
        case .house: source = Names.houses
        case .car: source = Names.cars
        case .boat: source = Names.boats
        }
        return source.map { item in
            let price = Int(Double(item.1) * Double.random(in: 0.85...1.2)) / 100 * 100
            return AssetListing(kind: kind, name: item.0, price: price)
        }
    }

    /// Whether a bank would lend for this purchase (20% down, steady job).
    func canFinance(_ listing: AssetListing) -> Bool {
        listing.kind == .house && job != nil && !(job?.partTime ?? true) && money >= listing.price / 5
            && (job?.salary ?? 0) * 6 >= listing.price
    }

    mutating func buy(_ listing: AssetListing, financed: Bool = false) -> Outcome {
        guard age >= 18 else { return Outcome(title: "Too Young", message: "I'm too young to buy that.") }
        if listing.kind == .car && !hasDriversLicense {
            return Outcome(title: "No License", message: "I need a driver's license before I can buy a car.")
        }
        let downPayment = financed ? listing.price / 5 : listing.price
        guard money >= downPayment, !financed || canFinance(listing) else {
            return Outcome(title: "Can't Afford", message: "I can't afford the \(listing.name). I need \(formatMoney(downPayment)).")
        }
        money -= downPayment
        assets.append(Asset(kind: listing.kind, name: listing.name, purchasePrice: listing.price, value: listing.price, loan: listing.price - downPayment))
        adjust(happiness: 10)
        let message = financed
            ? "I bought a \(listing.name) with a \(formatMoney(listing.price - downPayment)) mortgage!"
            : "I bought a \(listing.name) for \(formatMoney(listing.price))!"
        record(message)
        return Outcome(title: "Purchased", message: message)
    }

    mutating func sell(_ assetID: UUID) -> Outcome {
        guard let index = assets.firstIndex(where: { $0.id == assetID }) else {
            return Outcome(title: "Oops", message: "I don't own that anymore.")
        }
        let asset = assets.remove(at: index)
        money += asset.value - asset.loan
        let payoff = asset.loan > 0 ? " After paying off the loan I kept \(formatMoney(asset.value - asset.loan))." : ""
        let message = "I sold my \(asset.name) for \(formatMoney(asset.value)).\(payoff)"
        record(message)
        return Outcome(title: "Sold", message: message)
    }
}
