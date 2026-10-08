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
                LabeledContent("Years", value: "\(job.years)")
                if life.fame > 0 {
                    StatBar(label: "Fame", emoji: "⭐", value: life.fame)
                }
                VStack(alignment: .leading) {
                    StatBar(label: "Performance", emoji: "📊", value: job.performance)
                }
                Button { store.run { $0.workHarder() } } label: {
                    ActionRow(emoji: "💼", title: "Work Harder")
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
                            Text(opening.template.title + (opening.template.partTime ? " (Part-time)" : "") + (opening.template.famous ? " ⭐" : "") + (opening.template.military ? " 🪖" : ""))
                                .font(.body.weight(.medium))
                            Text(opening.company)
                                .font(.caption)
                                .foregroundStyle(.secondary)
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
