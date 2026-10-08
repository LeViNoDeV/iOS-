import SwiftUI

struct OccupationView: View {
    @EnvironmentObject private var store: GameStore
    @Environment(\.dismiss) private var dismiss
    @State private var openings: [JobOpening] = []
    @State private var choosingMajor = false
    @State private var choosingClub = false

    var body: some View {
        if let life = store.life {
            List {
                educationSection(life)
                careerSection(life)
                if life.age >= 10 && !life.inPrison {
                    gigsSection(life)
                }
                if life.age >= 14 && !life.inPrison {
                    jobsSection(life)
                }
                if life.age < 14 {
                    Section {
                        Text("You're too young to work. Come back when you're 14!")
                            .foregroundStyle(.secondary)
                    }
                }
            }
            .navigationTitle("Career & School")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .confirmationAction) {
                    Button("Done") { dismiss() }
                }
            }
            .onAppear { if openings.isEmpty { openings = life.jobListings() } }
            .confirmationDialog("Join a club", isPresented: $choosingClub, titleVisibility: .visible) {
                ForEach(schoolClubs, id: \.name) { club in
                    Button("\(club.emoji) \(club.name)") {
                        store.run { $0.joinClub(club.name) }
                    }
                }
            }
            .confirmationDialog("Choose a major", isPresented: $choosingMajor, titleVisibility: .visible) {
                ForEach(universityMajors, id: \.self) { major in
                    Button(major) {
                        store.run { $0.enrollUniversity(major: major) }
                    }
                }
            }
        }
    }

    // MARK: Education

    @ViewBuilder
    private func educationSection(_ life: Life) -> some View {
        Section("Education") {
            LabeledContent("Highest", value: life.education.label)
            if let major = life.major {
                LabeledContent("Major", value: major)
            }
            if !life.graduateDegrees.isEmpty {
                LabeledContent("Degrees", value: life.graduateDegrees.map(\.degreeName).joined(separator: ", "))
            }
            if life.studentLoans > 0 {
                LabeledContent("Student Loans", value: formatMoney(life.studentLoans))
            }

            if let school = life.schoolName {
                let grades = life.enrollment?.grades ?? life.schoolGrades
                LabeledContent("Attending", value: school)
                LabeledContent("Grades", value: "\(gradeLetter(grades)) (\(grades)%)")
                Button { store.run { $0.studyHarder() } } label: {
                    ActionRow(emoji: "📝", title: "Study Harder", subtitle: "Improve your grades")
                }
                if life.inGradeSchool {
                    LabeledContent("Popularity", value: "\(life.popularity)%")
                    if !life.clubs.isEmpty {
                        LabeledContent("Clubs", value: life.clubs.joined(separator: ", "))
                    }
                    Button { choosingClub = true } label: {
                        ActionRow(emoji: "🏫", title: "Join a Club", subtitle: "Sports, drama, debate & more")
                    }
                    Button { store.run { $0.skipSchool() } } label: {
                        ActionRow(emoji: "🛹", title: "Skip School")
                    }
                }
                if life.age >= 16 || life.enrollment != nil {
                    Button(role: .destructive) { store.run { $0.dropOut() } } label: {
                        ActionRow(emoji: "🚪", title: "Drop Out")
                    }
                }
            }

            if life.canEnrollInUniversity {
                Button { choosingMajor = true } label: {
                    ActionRow(emoji: "🏛️", title: "Enroll in University", subtitle: "4 years · \(formatMoney(universityTuitionPerYear))/yr")
                }
            }
            ForEach(GraduateField.allCases) { field in
                if life.canEnrollGraduate(field) {
                    Button { store.run { $0.enrollGraduate(field) } } label: {
                        ActionRow(emoji: "🎓", title: "Apply to \(field.schoolName)", subtitle: "\(field.years) years · \(formatMoney(field.tuitionPerYear))/yr")
                    }
                }
            }
        }
    }

    // MARK: Career

    @ViewBuilder
    private func careerSection(_ life: Life) -> some View {
        if let job = life.job {
            Section("Current Job") {
                LabeledContent("Title", value: job.title)
                LabeledContent("Company", value: job.company)
                LabeledContent("Salary", value: "\(formatMoney(job.salary))/yr")
                LabeledContent("Years", value: "\(job.years) (\(job.yearsInLevel) in this role)")
                if life.fame > 0 {
                    StatBar(label: "Fame", emoji: "⭐", value: life.fame)
                }
                StatBar(label: "Performance", emoji: "📊", value: job.performance)
            }

            if let template = life.jobTemplate, template.hasCareerPath {
                Section("Career Ladder") {
                    ForEach(Array(life.currentLadder.enumerated()), id: \.offset) { index, rung in
                        HStack {
                            Text(index < job.level ? "✅" : (index == job.level ? "📍" : "🔒"))
                            Text(rung)
                                .fontWeight(index == job.level ? .bold : .regular)
                                .foregroundStyle(index > job.level ? Color.secondary : Color.primary)
                            Spacer()
                            Text(formatMoney(life.jobSalary(atLevel: index)))
                                .font(.caption.monospacedDigit())
                                .foregroundStyle(.secondary)
                        }
                    }
                    if let branch = template.branch, job.track == nil {
                        HStack {
                            Text("🔀")
                            Text("Then: " + branch.tracks.map(\.name).joined(separator: ", "))
                                .foregroundStyle(.secondary)
                        }
                    }
                }
            }

            if life.mustChooseTrack, let branch = life.jobTemplate?.branch {
                Section {
                    ForEach(branch.tracks) { track in
                        let eligible = life.meets(track)
                        Button { store.run { $0.choose(track) } } label: {
                            HStack(alignment: .top, spacing: 12) {
                                Text(track.emoji).font(.title)
                                VStack(alignment: .leading, spacing: 3) {
                                    Text(track.name).font(.headline)
                                    Text(track.blurb).font(.caption).foregroundStyle(.secondary)
                                    Text("\(track.requirementText) · Starts as \(track.titles[0])")
                                        .font(.caption2)
                                        .foregroundStyle(eligible ? Color.secondary : Color.red)
                                }
                            }
                            .opacity(eligible ? 1 : 0.5)
                        }
                        .foregroundStyle(.primary)
                    }
                } header: {
                    Text("Choose Your Path")
                } footer: {
                    Text("Needs a year in your current role and decent performance. Specialist units are selective — you may need to apply more than once.")
                }
            }

            Section {
                ForEach(life.availableJobActions) { action in
                    let used = life.hasUsed(action)
                    Button { store.run { $0.perform(action) } } label: {
                        ActionRow(emoji: action.emoji, title: action.title, subtitle: used ? "Done this year" : nil, enabled: !used)
                    }
                    .disabled(used)
                }
                if !life.mustChooseTrack && job.level < life.currentLadder.count - 1 {
                    Button { store.run { $0.askForPromotion() } } label: {
                        ActionRow(emoji: "🪜", title: "Ask for a Promotion", subtitle: "Next: \(life.currentLadder[job.level + 1])")
                    }
                }
                Button { store.run { $0.askForRaise() } } label: {
                    ActionRow(emoji: "💵", title: "Ask for a Raise")
                }
                if life.canRetire {
                    Button { store.run { $0.retire() } } label: {
                        ActionRow(emoji: "🏖️", title: "Retire", subtitle: "Collect a pension")
                    }
                }
                Button(role: .destructive) { store.run { $0.quitJob() } } label: {
                    ActionRow(emoji: "🚪", title: "Quit Job")
                }
            } header: {
                Text("At Work")
            } footer: {
                Text("Each work action can be done once per year. Risky actions can get you fired, hurt or even arrested.")
            }
        } else if life.isRetired {
            Section("Retirement") {
                LabeledContent("Pension", value: "\(formatMoney(life.pension))/yr")
            }
        }
    }

    // MARK: Gigs

    private func gigsSection(_ life: Life) -> some View {
        Section {
            ForEach(Gig.allCases) { gig in
                let allowed = life.canDo(gig)
                Button { store.run { $0.work(gig) } } label: {
                    ActionRow(
                        emoji: gig.emoji,
                        title: gig.title,
                        subtitle: life.age < gig.minAge ? "Available at \(gig.minAge)" : "\(formatMoney(gig.pay.lowerBound))–\(formatMoney(gig.pay.upperBound))",
                        enabled: allowed
                    )
                }
                .disabled(!allowed)
            }
        } header: {
            Text("Freelance Gigs")
        } footer: {
            Text("Up to 3 gigs per year. \(max(0, 3 - life.count(.gigsThisYear))) left this year.")
        }
    }

    // MARK: Job listings

    private func jobsSection(_ life: Life) -> some View {
        Section {
            ForEach(openings) { opening in
                let qualified = life.meetsRequirements(opening.template)
                Button {
                    store.run { $0.apply(to: opening) }
                } label: {
                    HStack {
                        VStack(alignment: .leading, spacing: 2) {
                            Text(opening.template.entryTitle + (opening.template.partTime ? " (Part-time)" : "") + (opening.template.famous ? " ⭐" : "") + (opening.template.military ? " 🪖" : ""))
                                .font(.body.weight(.medium))
                            Text(opening.company)
                                .font(.caption)
                                .foregroundStyle(.secondary)
                            if opening.template.hasCareerPath {
                                Text("Career path up to \(opening.template.topTitle)")
                                    .font(.caption2)
                                    .foregroundStyle(.secondary)
                            }
                            Text(opening.template.requirementText)
                                .font(.caption2)
                                .foregroundStyle(qualified ? Color.secondary : Color.red)
                        }
                        Spacer()
                        Text(formatMoney(opening.salary))
                            .font(.callout.monospacedDigit())
                            .foregroundStyle(Color.lifeGreen)
                    }
                    .opacity(qualified ? 1 : 0.5)
                }
                .foregroundStyle(.primary)
            }
        } header: {
            HStack {
                Text("Job Openings")
                Spacer()
                Button("Refresh") { openings = life.jobListings() }
                    .font(.caption)
            }
        }
    }
}
