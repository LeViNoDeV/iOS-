import Foundation

// MARK: - Career ladders

/// Job titles from entry level to the top, keyed by `JobTemplate.id`.
let careerLadders: [String: [String]] = [
    "babysitter": ["Babysitter", "Nanny"],
    "cashier": ["Cashier", "Head Cashier"],
    "lifeguard": ["Junior Lifeguard", "Lifeguard", "Head Lifeguard"],
    "dogwalker": ["Dog Walker", "Pack Leader"],
    "janitor": ["Janitor", "Head Custodian", "Facilities Manager"],
    "fastfood": ["Fry Cook", "Shift Leader", "Assistant Manager", "Restaurant Manager"],
    "barista": ["Barista", "Shift Supervisor", "Café Manager"],
    "construction": ["Laborer", "Carpenter", "Foreman", "Site Manager"],
    "trucker": ["Truck Driver", "Senior Driver", "Fleet Manager"],
    "receptionist": ["Receptionist", "Office Coordinator", "Office Manager"],
    // Police branches into Patrol, Detective or SWAT after Police Officer (see `careerBranches`).
    "police": ["Police Cadet", "Police Officer"],
    "firefighter": ["Firefighter Recruit", "Firefighter", "Engineer", "Fire Lieutenant", "Fire Captain", "Fire Chief"],
    "model": ["Catalog Model", "Runway Model", "Fashion Model", "Supermodel"],
    "teacher": ["Substitute Teacher", "Teacher", "Department Head", "Vice Principal", "Principal"],
    "nurse": ["Nursing Assistant", "Registered Nurse", "Charge Nurse", "Head Nurse", "Director of Nursing"],
    "engineer": ["Junior Engineer", "Mechanical Engineer", "Senior Engineer", "Principal Engineer", "Chief Engineer"],
    "software": ["Junior Developer", "Software Engineer", "Senior Engineer", "Staff Engineer", "Principal Engineer", "CTO"],
    "accountant": ["Junior Accountant", "Accountant", "Senior Accountant", "Controller", "CFO"],
    "marketing": ["Marketing Assistant", "Marketing Associate", "Marketing Manager", "Marketing Director", "CMO"],
    "psych": ["Psychology Intern", "Psychologist", "Senior Psychologist", "Clinical Director"],
    "doctor": ["Resident", "Doctor", "Attending Physician", "Department Head", "Chief of Medicine"],
    "lawyer": ["Junior Associate", "Associate", "Senior Associate", "Partner", "Managing Partner"],
    "banker": ["Analyst", "Associate", "Vice President", "Director", "Managing Director"],
    "chef": ["Dishwasher", "Line Cook", "Sous Chef", "Head Chef", "Executive Chef"],
    "pilot": ["Flight Cadet", "First Officer", "Captain", "Senior Captain", "Chief Pilot"],
    "scientist": ["Lab Assistant", "Research Scientist", "Senior Scientist", "Lead Scientist", "Chief Scientist"],
    "soldier": ["Private", "Corporal", "Sergeant", "Lieutenant", "Captain", "Major", "Colonel", "General"],
    "actor": ["Extra", "Bit Part Actor", "Supporting Actor", "Lead Actor", "Movie Star", "Hollywood Legend"],
    "musician": ["Street Musician", "Bar Musician", "Opening Act", "Headliner", "Rock Star", "Music Legend"],
    "athlete": ["Rookie", "Starter", "Team Captain", "All-Star", "MVP"],
]

// MARK: - Career branches

/// A specialization a career can split into, with its own ranks.
struct CareerTrack: Identifiable {
    let id: String
    let name: String
    let emoji: String
    let blurb: String
    let titles: [String]
    var minSmarts = 0
    var minHealth = 0
    var payMultiplier = 1.0
    /// Chance of being accepted, before performance is factored in. 1 = guaranteed.
    var selectivity = 1.0

    var requirementText: String {
        var parts: [String] = []
        if minSmarts > 0 { parts.append("Smarts \(minSmarts)%+") }
        if minHealth > 0 { parts.append("Health \(minHealth)%+") }
        return parts.isEmpty ? "Open to everyone" : parts.joined(separator: " · ")
    }
}

/// Where a career splits: after reaching `atLevel - 1` on the base ladder, you pick a track.
struct CareerBranch {
    let atLevel: Int
    let tracks: [CareerTrack]
}

let careerBranches: [String: CareerBranch] = [
    "police": CareerBranch(atLevel: 2, tracks: [
        CareerTrack(id: "patrol", name: "Patrol", emoji: "🚓",
                    blurb: "Stay on the streets and rise through the uniformed ranks to run the whole department.",
                    titles: ["Patrol Sergeant", "Patrol Lieutenant", "Patrol Captain", "Deputy Chief", "Police Chief"]),
        CareerTrack(id: "detective", name: "Detective", emoji: "🕵️",
                    blurb: "Trade the uniform for a badge and solve murders, robberies and cold cases.",
                    titles: ["Detective", "Senior Detective", "Detective Sergeant", "Detective Lieutenant", "Chief of Detectives"],
                    minSmarts: 55, payMultiplier: 1.1, selectivity: 0.6),
        CareerTrack(id: "swat", name: "SWAT", emoji: "🛡️",
                    blurb: "Join the elite tactical unit for hostage rescues, raids and high-risk warrants.",
                    titles: ["SWAT Operator", "SWAT Team Leader", "SWAT Sergeant", "SWAT Lieutenant", "SWAT Commander"],
                    minHealth: 75, payMultiplier: 1.2, selectivity: 0.5),
    ]),
]

extension JobTemplate {
    /// The shared ladder before any branch.
    var ladder: [String] { careerLadders[id] ?? [title] }
    var branch: CareerBranch? { careerBranches[id] }
    var entryTitle: String { ladder[0] }
    var topTitle: String {
        if let branch = branch { return branch.tracks.compactMap { $0.titles.last }.joined(separator: " / ") }
        return ladder[ladder.count - 1]
    }
    var hasCareerPath: Bool { ladder.count > 1 || branch != nil }

    func track(_ id: String?) -> CareerTrack? {
        guard let id = id else { return nil }
        return branch?.tracks.first { $0.id == id }
    }

    /// Full ladder for someone on the given track (base ladder only if no track yet).
    func ladder(track id: String?) -> [String] {
        ladder + (track(id)?.titles ?? [])
    }

    /// Salary for a given rung of the ladder.
    func salary(atLevel level: Int, base: Int? = nil) -> Int {
        Int(Double(base ?? baseSalary) * pow(1.3, Double(level)))
    }
}

// MARK: - Job-specific actions

struct JobAction: Identifiable, Hashable {
    let id: String
    let title: String
    let emoji: String
    var successChance = 0.7
    let success: String
    let failure: String
    /// Performance gained on success (half is lost on failure).
    var performance = 8
    var happiness = 0
    var fame = 0
    var bonus: ClosedRange<Int>? = nil
    var karma = 0
    /// Health lost on failure.
    var injury = 0
    var deathRisk = 0.0
    var deathCause = "an accident at work"
    var firedRisk = 0.0
    /// Prison sentence risked on failure (for shady actions).
    var prison: ClosedRange<Int>? = nil
    var minLevel = 0
}

/// Actions every full-time job has.
let commonJobActions: [JobAction] = [
    JobAction(id: "hard", title: "Work Harder", emoji: "💼", successChance: 0.9,
              success: "I put in extra hours and my boss noticed.", failure: "I worked late but made a bunch of mistakes.",
              performance: 9, happiness: -2),
    JobAction(id: "coworkers", title: "Hang Out with Coworkers", emoji: "🍻", successChance: 0.8,
              success: "I went for drinks with my coworkers. We're getting along great.", failure: "I said something awkward at the office happy hour.",
              performance: 3, happiness: 6),
    JobAction(id: "slack", title: "Slack Off", emoji: "😴", successChance: 0.6,
              success: "I spent the day scrolling my phone and nobody noticed.", failure: "My boss caught me napping at my desk.",
              performance: -2, happiness: 8, firedRisk: 0.1),
]

/// Extra actions for each job, keyed by `JobTemplate.id`.
let jobActions: [String: [JobAction]] = [
    "babysitter": [
        JobAction(id: "games", title: "Play Games with the Kids", emoji: "🧸", success: "The kids had a blast and their parents tipped me.", failure: "The kids threw a tantrum the whole night.", performance: 8, happiness: 3, bonus: 10...50),
        JobAction(id: "tv", title: "Park Them in Front of the TV", emoji: "📺", successChance: 0.5, success: "The kids watched cartoons and I got some homework done.", failure: "The parents came home early and caught me ignoring their kids.", performance: -3, happiness: 4, firedRisk: 0.3),
    ],
    "cashier": [
        JobAction(id: "upsell", title: "Upsell Customers", emoji: "🛒", success: "I convinced a customer to buy the premium version.", failure: "A customer yelled at me for being pushy.", performance: 7),
        JobAction(id: "steal", title: "Skim from the Register", emoji: "💵", successChance: 0.6, success: "I pocketed some cash from the register.", failure: "My manager counted the drawer and caught me stealing!", performance: 0, bonus: 20...200, karma: -5, firedRisk: 1.0),
    ],
    "lifeguard": [
        JobAction(id: "rescue", title: "Rescue a Swimmer", emoji: "🛟", successChance: 0.75, success: "I pulled a drowning kid out of the water. I'm a hero!", failure: "I swallowed a lot of water during a rescue attempt.", performance: 15, happiness: 8, karma: 5, injury: 6),
        JobAction(id: "tan", title: "Work on My Tan", emoji: "😎", successChance: 0.7, success: "I got a great tan in my lifeguard chair.", failure: "I got a nasty sunburn.", performance: -2, happiness: 5, injury: 4),
    ],
    "dogwalker": [
        JobAction(id: "pack", title: "Walk a Big Pack", emoji: "🐕", successChance: 0.65, success: "I walked eight dogs at once and earned extra.", failure: "The dogs dragged me through a puddle.", performance: 8, bonus: 20...100, injury: 3),
    ],
    "janitor": [
        JobAction(id: "deep", title: "Deep Clean the Building", emoji: "🧹", success: "The building has never been this spotless.", failure: "I knocked over a full mop bucket in the lobby.", performance: 10),
        JobAction(id: "snoop", title: "Snoop Through Offices", emoji: "🕵️", successChance: 0.6, success: "I found some juicy gossip in the CEO's trash.", failure: "Security caught me rummaging through desks.", performance: 0, happiness: 6, firedRisk: 0.6),
    ],
    "fastfood": [
        JobAction(id: "rush", title: "Handle the Lunch Rush", emoji: "🍔", success: "I flipped 300 burgers without breaking a sweat.", failure: "I burned my hand on the fryer.", performance: 10, injury: 5),
        JobAction(id: "spit", title: "Mess with a Rude Customer's Order", emoji: "🤢", successChance: 0.6, success: "I got my revenge on a rude customer.", failure: "A coworker reported me to the manager.", performance: 0, happiness: 5, karma: -4, firedRisk: 0.8),
    ],
    "barista": [
        JobAction(id: "latte", title: "Make Latte Art", emoji: "☕", success: "Customers loved my latte art and tipped well.", failure: "My latte art looked like a blob.", performance: 7, happiness: 3, bonus: 20...80),
        JobAction(id: "freebies", title: "Give Friends Free Drinks", emoji: "🥤", successChance: 0.6, success: "My friends got free coffee all week.", failure: "My manager noticed the missing inventory.", performance: -1, happiness: 4, firedRisk: 0.4),
    ],
    "construction": [
        JobAction(id: "heavy", title: "Operate Heavy Machinery", emoji: "🚜", successChance: 0.7, success: "I operated the crane like a pro.", failure: "I had an accident with the excavator.", performance: 12, injury: 15, deathRisk: 0.03, deathCause: "a construction accident"),
        JobAction(id: "corners", title: "Cut Corners", emoji: "📐", successChance: 0.55, success: "We finished the job ahead of schedule.", failure: "An inspector found serious safety violations.", performance: 6, karma: -3, firedRisk: 0.4),
    ],
    "trucker": [
        JobAction(id: "overnight", title: "Drive Overnight", emoji: "🌙", successChance: 0.7, success: "I delivered my load a day early and got a bonus.", failure: "I dozed off at the wheel and crashed.", performance: 10, bonus: 500...2_000, injury: 20, deathRisk: 0.05, deathCause: "a trucking accident"),
        JobAction(id: "contraband", title: "Smuggle Contraband", emoji: "📦", successChance: 0.55, success: "I hauled a mysterious crate across state lines for cash.", failure: "Police searched my truck at a weigh station.", performance: 0, bonus: 5_000...20_000, karma: -6, prison: 2...6),
    ],
    "receptionist": [
        JobAction(id: "phones", title: "Juggle the Phones", emoji: "☎️", success: "I handled 200 calls without a single mistake.", failure: "I transferred the CEO's call to the janitor.", performance: 8),
        JobAction(id: "gossip", title: "Spread Office Gossip", emoji: "🗣️", successChance: 0.6, success: "Everyone comes to me for the latest gossip now.", failure: "My gossip got back to the person I was talking about.", performance: -2, happiness: 6, karma: -2, firedRisk: 0.15),
    ],
    "police": [
        JobAction(id: "beat", title: "Walk the Beat", emoji: "👮", successChance: 0.85, success: "I got to know the neighborhood and stopped a mugging.", failure: "A suspect got away from me.", performance: 8, karma: 2, injury: 4),
        JobAction(id: "bribe", title: "Take a Bribe", emoji: "💰", successChance: 0.6, success: "I let a dealer go in exchange for cash.", failure: "Internal Affairs caught me taking a bribe.", performance: 0, bonus: 2_000...15_000, karma: -10, prison: 2...8),
    ],
    "police.patrol": [
        JobAction(id: "traffic", title: "Run Traffic Stops", emoji: "🚦", successChance: 0.85, success: "I wrote 40 tickets and caught a driver with a stolen car.", failure: "A driver I pulled over filed a complaint against me.", performance: 9),
        JobAction(id: "chase", title: "High-Speed Chase", emoji: "🏎️", successChance: 0.6, success: "I chased down a getaway car and made the arrest!", failure: "I crashed my cruiser during the chase.", performance: 15, fame: 1, injury: 15, deathRisk: 0.04, deathCause: "a high-speed police chase"),
        JobAction(id: "community", title: "Community Outreach", emoji: "🤝", successChance: 0.9, success: "I coached a youth basketball league. The neighborhood loves me.", failure: "Nobody showed up to my community meeting.", performance: 6, happiness: 5, karma: 4),
    ],
    "police.detective": [
        JobAction(id: "case", title: "Investigate a Case", emoji: "🔍", successChance: 0.65, success: "I followed the evidence and arrested the killer.", failure: "My lead suspect had an airtight alibi.", performance: 12, karma: 2),
        JobAction(id: "interrogate", title: "Interrogate a Suspect", emoji: "💡", successChance: 0.6, success: "I got a full confession in the interrogation room.", failure: "The suspect lawyered up and walked.", performance: 10),
        JobAction(id: "undercover", title: "Go Undercover", emoji: "🥸", successChance: 0.5, success: "I infiltrated a crime ring and brought them all down!", failure: "My cover was blown and the gang beat me badly.", performance: 22, fame: 3, injury: 30, deathRisk: 0.08, deathCause: "being discovered while undercover"),
        JobAction(id: "coldcase", title: "Crack a Cold Case", emoji: "🗄️", successChance: 0.35, success: "I solved a 20-year-old murder. It's all over the news!", failure: "The trail went cold again.", performance: 20, fame: 4, karma: 4, minLevel: 3),
        JobAction(id: "plant", title: "Plant Evidence", emoji: "🧤", successChance: 0.55, success: "I planted evidence to close a case I couldn't crack.", failure: "A defense attorney proved I planted evidence.", performance: 12, karma: -12, prison: 3...10),
    ],
    "police.swat": [
        JobAction(id: "breach", title: "Breach Training", emoji: "🧨", successChance: 0.85, success: "I led my squad through a flawless training breach.", failure: "A flashbang went off too close to me.", performance: 8, injury: 8),
        JobAction(id: "raid", title: "Lead a Drug Raid", emoji: "🚨", successChance: 0.6, success: "The raid was a success and made the evening news.", failure: "I was shot during the raid.", performance: 18, fame: 2, injury: 25, deathRisk: 0.08, deathCause: "a gunshot wound on duty"),
        JobAction(id: "hostage", title: "Rescue Hostages", emoji: "🛡️", successChance: 0.55, success: "I freed every hostage without a single casualty. I'm a hero!", failure: "The standoff went badly and I was wounded.", performance: 22, happiness: 8, fame: 4, karma: 5, injury: 30, deathRisk: 0.1, deathCause: "a hostage standoff"),
        JobAction(id: "sniper", title: "Sniper Overwatch", emoji: "🎯", successChance: 0.7, success: "I neutralized an armed gunman from 400 yards.", failure: "I missed the shot and the suspect escaped.", performance: 14, karma: -1, minLevel: 3),
    ],
    "firefighter": [
        JobAction(id: "fire", title: "Fight a Fire", emoji: "🔥", successChance: 0.7, success: "I put out a blazing apartment fire.", failure: "I suffered smoke inhalation.", performance: 12, karma: 3, injury: 15, deathRisk: 0.04, deathCause: "a burning building collapsing"),
        JobAction(id: "rescue", title: "Rescue Someone", emoji: "🧑‍🚒", successChance: 0.6, success: "I carried a family out of a burning house. Hero!", failure: "I got burned trying to reach someone.", performance: 18, happiness: 8, fame: 2, karma: 6, injury: 20),
        JobAction(id: "cat", title: "Rescue a Cat from a Tree", emoji: "🐈", successChance: 0.9, success: "I got a cat down from a tree. The kids cheered.", failure: "The cat scratched my face.", performance: 4, happiness: 4, karma: 2, injury: 2),
    ],
    "model": [
        JobAction(id: "photo", title: "Do a Photo Shoot", emoji: "📸", success: "The photographer said I was a natural.", failure: "I blinked in every shot.", performance: 10, fame: 2),
        JobAction(id: "runway", title: "Walk the Runway", emoji: "👠", successChance: 0.65, success: "I nailed my runway walk at fashion week!", failure: "I tripped on the runway in front of everyone.", performance: 14, fame: 4, injury: 3, minLevel: 1),
        JobAction(id: "diet", title: "Crash Diet for a Show", emoji: "🥬", successChance: 0.7, success: "I slimmed down for the big show.", failure: "I fainted from hunger backstage.", performance: 8, happiness: -4, injury: 10),
    ],
    "teacher": [
        JobAction(id: "lesson", title: "Plan a Great Lesson", emoji: "📝", success: "My students were actually excited about class today.", failure: "My lesson put the whole class to sleep.", performance: 9),
        JobAction(id: "detention", title: "Give Detention", emoji: "⏰", successChance: 0.7, success: "Order has been restored in my classroom.", failure: "The student's parents filed a complaint.", performance: 4, karma: -1),
        JobAction(id: "tutor", title: "Tutor After School", emoji: "🍎", success: "I tutored a struggling student for extra cash.", failure: "The student skipped our tutoring session.", performance: 5, bonus: 200...800, karma: 2),
    ],
    "nurse": [
        JobAction(id: "double", title: "Work a Double Shift", emoji: "🏥", success: "I worked a 16-hour shift and saved a patient's life.", failure: "I was so exhausted I nearly collapsed.", performance: 12, happiness: -3, injury: 6),
        JobAction(id: "comfort", title: "Comfort a Patient", emoji: "🤲", successChance: 0.9, success: "I held a scared patient's hand all night.", failure: "The patient was too grumpy to talk.", performance: 6, happiness: 4, karma: 4),
        JobAction(id: "meds", title: "Pocket Some Painkillers", emoji: "💊", successChance: 0.55, success: "I slipped a bottle of painkillers into my bag.", failure: "The pharmacy audit caught me.", performance: 0, bonus: 500...3_000, karma: -8, firedRisk: 1.0, prison: 1...3),
    ],
    "engineer": [
        JobAction(id: "design", title: "Design a New Part", emoji: "⚙️", success: "My design was approved for production.", failure: "My prototype failed stress testing.", performance: 10),
        JobAction(id: "patent", title: "File a Patent", emoji: "📜", successChance: 0.4, success: "My invention was patented and licensed!", failure: "My patent was rejected.", performance: 15, bonus: 5_000...50_000, minLevel: 2),
    ],
    "software": [
        JobAction(id: "ship", title: "Ship a Feature", emoji: "🚀", success: "My feature launched without a single bug.", failure: "My code took down production for an hour.", performance: 10),
        JobAction(id: "hackathon", title: "Win a Hackathon", emoji: "🏆", successChance: 0.35, success: "My team won the company hackathon!", failure: "Our hackathon demo crashed on stage.", performance: 15, happiness: 6, bonus: 1_000...10_000),
        JobAction(id: "oncall", title: "Take On-Call Duty", emoji: "📟", successChance: 0.8, success: "I fixed a 3 AM outage in record time.", failure: "I slept through my pager.", performance: 8, happiness: -4, firedRisk: 0.05),
    ],
    "accountant": [
        JobAction(id: "audit", title: "Do an Audit", emoji: "🧾", success: "I found $2 million in accounting errors.", failure: "I miscounted a column and everything was off.", performance: 10),
        JobAction(id: "taxes", title: "Prepare Taxes on the Side", emoji: "📊", success: "I did taxes for neighbors and made some cash.", failure: "I filed a client's taxes wrong.", performance: 2, bonus: 1_000...6_000),
        JobAction(id: "embezzle", title: "Embezzle Funds", emoji: "🏦", successChance: 0.5, success: "I quietly moved company money into my account.", failure: "Forensic auditors traced the missing money to me.", performance: 0, bonus: 20_000...200_000, karma: -12, prison: 3...12),
    ],
    "marketing": [
        JobAction(id: "campaign", title: "Launch a Campaign", emoji: "📣", success: "My ad campaign went viral!", failure: "My campaign was a flop.", performance: 12, fame: 1),
        JobAction(id: "pitch", title: "Pitch a Big Client", emoji: "🤝", successChance: 0.55, success: "I landed a huge new client.", failure: "The client walked out of my pitch.", performance: 15, bonus: 2_000...10_000, minLevel: 1),
    ],
    "psych": [
        JobAction(id: "session", title: "Run a Therapy Session", emoji: "🛋️", success: "I helped a patient make a breakthrough.", failure: "My patient stormed out of our session.", performance: 9, karma: 2),
        JobAction(id: "paper", title: "Publish a Paper", emoji: "📄", successChance: 0.5, success: "My research paper was published in a top journal.", failure: "My paper was rejected by every journal.", performance: 14, fame: 2),
    ],
    "doctor": [
        JobAction(id: "surgery", title: "Perform Surgery", emoji: "🩺", successChance: 0.75, success: "The surgery was a complete success.", failure: "There were complications during surgery. The family is suing.", performance: 14, karma: 3, firedRisk: 0.1),
        JobAction(id: "rounds", title: "Do Hospital Rounds", emoji: "📋", successChance: 0.9, success: "I checked on every patient in the ward.", failure: "I mixed up two patients' charts.", performance: 7),
        JobAction(id: "research", title: "Lead a Clinical Trial", emoji: "🧪", successChance: 0.45, success: "My clinical trial led to a medical breakthrough!", failure: "The clinical trial was shut down.", performance: 20, fame: 4, bonus: 10_000...50_000, minLevel: 2),
        JobAction(id: "pills", title: "Write Shady Prescriptions", emoji: "💊", successChance: 0.6, success: "I sold prescriptions under the table.", failure: "The medical board investigated me.", performance: 0, bonus: 10_000...60_000, karma: -12, firedRisk: 1.0, prison: 2...8),
    ],
    "lawyer": [
        JobAction(id: "trial", title: "Argue a Case in Court", emoji: "⚖️", successChance: 0.6, success: "I won my case with a brilliant closing argument!", failure: "I lost the case and my client is furious.", performance: 15, fame: 1),
        JobAction(id: "settle", title: "Negotiate a Settlement", emoji: "🤝", successChance: 0.75, success: "I negotiated a fat settlement for my client.", failure: "Settlement talks fell apart.", performance: 9, bonus: 2_000...15_000),
        JobAction(id: "bill", title: "Pad My Billable Hours", emoji: "⏱️", successChance: 0.6, success: "I billed a client for 30 hours I didn't work.", failure: "The client noticed and reported me to the bar.", performance: 2, bonus: 5_000...20_000, karma: -6, firedRisk: 0.7),
    ],
    "banker": [
        JobAction(id: "deal", title: "Close a Deal", emoji: "📈", successChance: 0.6, success: "I closed a billion-dollar merger and got a huge bonus.", failure: "The deal collapsed at the last minute.", performance: 15, bonus: 20_000...150_000),
        JobAction(id: "allnighter", title: "Pull an All-Nighter", emoji: "🌃", successChance: 0.85, success: "I finished the pitch deck by sunrise.", failure: "I passed out at my desk.", performance: 10, happiness: -6, injury: 6),
        JobAction(id: "insider", title: "Insider Trading", emoji: "🕴️", successChance: 0.55, success: "I traded on a tip and made a killing.", failure: "The SEC caught me insider trading.", performance: 0, bonus: 50_000...500_000, karma: -10, prison: 2...10),
    ],
    "chef": [
        JobAction(id: "special", title: "Create a New Special", emoji: "🍝", success: "My new dish sold out in an hour.", failure: "Customers sent my special back to the kitchen.", performance: 10),
        JobAction(id: "critic", title: "Cook for a Food Critic", emoji: "⭐", successChance: 0.5, success: "The food critic gave us five stars!", failure: "The critic called my food 'inedible'.", performance: 18, fame: 3, minLevel: 2),
        JobAction(id: "knife", title: "Show Off Knife Skills", emoji: "🔪", successChance: 0.7, success: "I diced an onion in 4 seconds. The kitchen applauded.", failure: "I sliced my finger.", performance: 5, happiness: 3, injury: 6),
    ],
    "pilot": [
        JobAction(id: "fly", title: "Fly a Long-Haul Route", emoji: "✈️", success: "I flew to Tokyo and back with a perfect landing.", failure: "I had a rough landing and passengers complained.", performance: 9),
        JobAction(id: "emergency", title: "Handle an Emergency", emoji: "⚠️", successChance: 0.7, success: "I landed safely with one engine out. I'm on the news!", failure: "The plane went down.", performance: 20, fame: 5, deathRisk: 0.3, deathCause: "a plane crash"),
    ],
    "scientist": [
        JobAction(id: "experiment", title: "Run an Experiment", emoji: "🔬", success: "My experiment produced exciting results.", failure: "My experiment blew up in my face.", performance: 10, injury: 5),
        JobAction(id: "grant", title: "Apply for a Grant", emoji: "💸", successChance: 0.45, success: "I was awarded a major research grant!", failure: "My grant application was rejected.", performance: 14, bonus: 5_000...40_000),
        JobAction(id: "fake", title: "Fake My Data", emoji: "🧮", successChance: 0.6, success: "I fudged my results and published them.", failure: "Other scientists exposed my fake data.", performance: 12, karma: -8, firedRisk: 1.0),
    ],
    "soldier": [
        JobAction(id: "train", title: "Train Hard", emoji: "🏃", successChance: 0.85, success: "I aced my physical fitness test.", failure: "I pulled a muscle during training.", performance: 10, injury: 5),
        JobAction(id: "volunteer", title: "Volunteer for a Mission", emoji: "🪖", successChance: 0.65, success: "I completed a dangerous mission and earned a medal.", failure: "I was wounded in combat.", performance: 20, karma: 2, injury: 25, deathRisk: 0.1, deathCause: "wounds suffered in combat"),
        JobAction(id: "desert", title: "Go AWOL", emoji: "🏃‍♂️", successChance: 0.3, success: "I slipped away from base for a wild weekend.", failure: "Military police dragged me back and court-martialed me.", performance: -10, happiness: 10, prison: 1...5),
    ],
    "actor": [
        JobAction(id: "audition", title: "Audition for a Role", emoji: "🎬", successChance: 0.5, success: "I landed a role in a big movie!", failure: "The casting director said I wasn't right for it.", performance: 14, fame: 5, bonus: 5_000...50_000),
        JobAction(id: "redcarpet", title: "Walk the Red Carpet", emoji: "📸", successChance: 0.8, success: "The paparazzi went crazy for my outfit.", failure: "I made the worst-dressed list.", performance: 5, fame: 4, minLevel: 2),
        JobAction(id: "interview", title: "Do a Talk Show Interview", emoji: "🎙️", successChance: 0.7, success: "I had the audience in stitches.", failure: "I said something offensive and got canceled online.", performance: 8, fame: 3, minLevel: 1),
    ],
    "musician": [
        JobAction(id: "record", title: "Record a Song", emoji: "🎧", successChance: 0.6, success: "My new song is climbing the charts!", failure: "My new song got terrible reviews.", performance: 12, fame: 4, bonus: 1_000...30_000),
        JobAction(id: "tour", title: "Go on Tour", emoji: "🚌", successChance: 0.7, success: "I sold out every show on my tour!", failure: "Half my tour dates were canceled.", performance: 15, happiness: 5, fame: 5, bonus: 10_000...200_000, injury: 4, minLevel: 2),
        JobAction(id: "practice", title: "Practice My Instrument", emoji: "🎸", successChance: 0.9, success: "My skills are getting better every day.", failure: "I broke a string mid-solo.", performance: 7),
    ],
    "athlete": [
        JobAction(id: "practice", title: "Practice with the Team", emoji: "🏟️", successChance: 0.85, success: "I dominated at practice today.", failure: "I sprained my ankle at practice.", performance: 9, injury: 8),
        JobAction(id: "game", title: "Play the Big Game", emoji: "🏅", successChance: 0.55, success: "I scored the winning point in the big game!", failure: "I choked in the big game and the fans booed me.", performance: 18, happiness: 8, fame: 5, injury: 6),
        JobAction(id: "steroids", title: "Take Steroids", emoji: "💉", successChance: 0.6, success: "I'm faster and stronger than ever.", failure: "I failed a drug test and was suspended.", performance: 15, karma: -6, injury: 8, firedRisk: 0.8),
    ],
]

// MARK: - Life + careers

extension Life {
    var jobTemplate: JobTemplate? {
        guard let current = job else { return nil }
        return jobCatalog.first { $0.id == current.templateID }
    }

    var jobTrack: CareerTrack? { jobTemplate?.track(job?.track) }

    /// The ladder for the current job, including the chosen track.
    var currentLadder: [String] {
        guard let template = jobTemplate else { return [] }
        return template.ladder(track: job?.track)
    }

    /// Salary for a level of the current job's ladder.
    func jobSalary(atLevel level: Int) -> Int {
        guard let current = job, let template = jobTemplate else { return 0 }
        let pay = template.salary(atLevel: level, base: current.baseSalary)
        return level >= (template.branch?.atLevel ?? Int.max) ? Int(Double(pay) * (jobTrack?.payMultiplier ?? 1)) : pay
    }

    /// True when the next step up requires picking a specialization.
    var mustChooseTrack: Bool {
        guard let current = job, let branch = jobTemplate?.branch else { return false }
        return current.track == nil && current.level == branch.atLevel - 1
    }

    func meets(_ track: CareerTrack) -> Bool {
        stats.smarts >= track.minSmarts && stats.health >= track.minHealth
    }

    mutating func choose(_ track: CareerTrack) -> Outcome {
        guard var current = job, mustChooseTrack else {
            return Outcome(title: track.name, message: "I can't switch tracks right now.")
        }
        guard current.yearsInLevel >= 1 && current.performance >= 50 else {
            return Outcome(title: track.name, message: "I need at least a year on the job and solid performance before I can specialize.")
        }
        guard !current.usedActions.contains("track") else {
            return Outcome(title: track.name, message: "I already applied for a new role this year.")
        }
        guard meets(track) else {
            return Outcome(title: track.name, message: "I don't meet the requirements for \(track.name): \(track.requirementText).")
        }
        current.usedActions.append("track")
        let chance = track.selectivity >= 1 ? 1 : track.selectivity + Double(current.performance - 50) / 150
        guard roll(chance) else {
            job = current
            let message = "\(track.emoji) I applied to join \(track.name), but I wasn't selected. Maybe next year."
            adjust(happiness: -6)
            record(message)
            return Outcome(title: track.name, message: message)
        }
        current.track = track.id
        job = current
        record("\(track.emoji) I chose the \(track.name) career path.")
        return Outcome(title: track.name, message: promote())
    }

    /// The actions available at the current job.
    var availableJobActions: [JobAction] {
        guard let current = job, let template = jobTemplate else { return [] }
        let trackActions = current.track.flatMap { jobActions["\(template.id).\($0)"] } ?? []
        let specific = ((jobActions[template.id] ?? []) + trackActions).filter { $0.minLevel <= current.level }
        return template.partTime ? specific + [commonJobActions[0]] : specific + commonJobActions
    }

    func hasUsed(_ action: JobAction) -> Bool { job?.usedActions.contains(action.id) ?? true }

    mutating func perform(_ action: JobAction) -> Outcome {
        guard var current = job else { return Outcome(title: action.title, message: "I don't have a job.") }
        guard !current.usedActions.contains(action.id) else {
            return Outcome(title: action.title, message: "I've already done that this year.")
        }
        current.usedActions.append(action.id)

        let skill = Double(stats.smarts + stats.health + stats.happiness) / 600 - 0.25
        let chance = (action.successChance + skill + Double(current.level) * 0.02).clamped(to: 0.05...0.95)
        var message: String

        if roll(chance) {
            current.performance = (current.performance + action.performance).clamped(to: 0...100)
            job = current
            adjust(happiness: action.happiness)
            fame = (fame + action.fame).clamped(to: 0...100)
            karma += action.karma
            message = "\(action.emoji) \(action.success)"
            if let range = action.bonus {
                let bonus = Int.random(in: range)
                money += bonus
                message += " (+\(formatMoney(bonus)))"
            }
        } else {
            current.performance = (current.performance - max(3, abs(action.performance) / 2)).clamped(to: 0...100)
            job = current
            adjust(happiness: -3 - abs(action.happiness) / 2, health: -action.injury)
            if action.karma < 0 { karma += action.karma }
            message = "\(action.emoji) \(action.failure)"

            if action.deathRisk > 0 && roll(action.deathRisk) {
                die(cause: action.deathCause)
                message += " I didn't survive."
            } else if let sentence = action.prison, age >= 18 {
                let years = Int.random(in: sentence)
                criminalRecord.append(action.title)
                record(message)
                sendToPrison(years: years)
                message += " I was sentenced to \(years) year\(years == 1 ? "" : "s") in prison."
                record("🚔 I was sentenced to \(years) year\(years == 1 ? "" : "s") in prison.")
                return Outcome(title: action.title, message: message)
            } else if action.firedRisk > 0 && roll(action.firedRisk) {
                job = nil
                adjust(happiness: -10)
                message += " I was fired!"
            }
        }
        record(message)
        return Outcome(title: action.title, message: message)
    }

    /// Asks the boss to move up a rung.
    mutating func askForPromotion() -> Outcome {
        guard var current = job, let template = jobTemplate else {
            return Outcome(title: "Promotion", message: "I don't have a job.")
        }
        if mustChooseTrack {
            return Outcome(title: "Promotion", message: "To move up from \(current.title), I need to choose a specialization first.")
        }
        guard current.level < currentLadder.count - 1 else {
            return Outcome(title: "Promotion", message: "I'm already the \(current.title). There's nowhere left to climb!")
        }
        guard !current.usedActions.contains("promotion") else {
            return Outcome(title: "Promotion", message: "I already asked for a promotion this year.")
        }
        current.usedActions.append("promotion")
        let message: String
        let chance = Double(current.performance - 40) / 80 + (current.yearsInLevel >= 2 ? 0.15 : -0.2)
        if current.performance >= 60 && current.yearsInLevel >= 1 && roll(chance) {
            job = current
            message = promote()
        } else {
            current.performance = max(0, current.performance - 5)
            job = current
            message = current.yearsInLevel < 1
                ? "My boss said I need more time in my current role first."
                : "My boss turned down my request for a promotion."
            adjust(happiness: -5)
            record(message)
        }
        return Outcome(title: "Promotion", message: message)
    }

    /// Moves the current job up one rung and returns the log text.
    @discardableResult
    mutating func promote() -> String {
        let ladder = currentLadder
        guard var current = job, current.level < ladder.count - 1 else { return "" }
        current.level += 1
        current.yearsInLevel = 0
        current.title = ladder[current.level]
        let newSalary = max(current.salary, jobSalary(atLevel: current.level))
        current.salary = newSalary
        current.performance = max(50, current.performance - 15)
        job = current
        adjust(happiness: 12)
        let crown = current.level == ladder.count - 1 ? " I've reached the top of my field! 👑" : ""
        let message = "📈 I was promoted to \(current.title)! My salary is now \(formatMoney(newSalary)).\(crown)"
        record(message)
        return message
    }
}
