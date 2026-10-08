import SwiftUI

struct AssetsView: View {
    @EnvironmentObject private var store: GameStore
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        if let life = store.life {
            List {
                Section("Finances") {
                    LabeledContent("Bank Balance", value: formatMoney(life.money))
                    LabeledContent("Net Worth", value: formatMoney(life.netWorth))
                    if life.studentLoans > 0 {
                        LabeledContent("Student Loans", value: formatMoney(life.studentLoans))
                    }
                }

                Section("My Stuff") {
                    if life.assets.isEmpty {
                        Text("You don't own anything yet.")
                            .foregroundStyle(.secondary)
                    }
                    ForEach(life.assets) { asset in
                        HStack {
                            Text(asset.emoji).font(.title2)
                            VStack(alignment: .leading) {
                                Text(asset.name).font(.body.weight(.medium))
                                Text(asset.loan > 0 ? "Loan: \(formatMoney(asset.loan))" : "Bought for \(formatMoney(asset.purchasePrice))")
                                    .font(.caption)
                                    .foregroundStyle(.secondary)
                            }
                            Spacer()
                            VStack(alignment: .trailing) {
                                Text(formatMoney(asset.value))
                                    .font(.callout.monospacedDigit())
                                Button("Sell") { store.run { $0.sell(asset.id) } }
                                    .font(.caption.bold())
                                    .buttonStyle(.bordered)
                                    .tint(.red)
                            }
                        }
                    }
                }

                Section("Shopping") {
                    if life.age < 18 {
                        Text("You can start buying property and cars at 18.")
                            .foregroundStyle(.secondary)
                    } else if life.inPrison {
                        Text("You can't go shopping from prison.")
                            .foregroundStyle(.secondary)
                    } else {
                        NavigationLink {
                            MarketView(kind: .house)
                        } label: {
                            ActionRow(emoji: "🏡", title: "Real Estate", subtitle: "Buy a home")
                        }
                        NavigationLink {
                            MarketView(kind: .car)
                        } label: {
                            ActionRow(emoji: "🚘", title: "Car Dealership", subtitle: life.hasDriversLicense ? "Buy a ride" : "Requires a driver's license")
                        }
                        NavigationLink {
                            MarketView(kind: .boat)
                        } label: {
                            ActionRow(emoji: "⛵", title: "Boat Dealership", subtitle: "Hit the water")
                        }
                    }
                }
            }
            .navigationTitle("Assets")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .confirmationAction) {
                    Button("Done") { dismiss() }
                }
            }
        }
    }
}

struct MarketView: View {
    @EnvironmentObject private var store: GameStore
    let kind: AssetKind
    @State private var listings: [AssetListing] = []
    @State private var pending: AssetListing?

    var body: some View {
        List {
            Section {
                LabeledContent("Bank Balance", value: formatMoney(store.life?.money ?? 0))
            }
            Section {
                ForEach(listings) { listing in
                    let canFinance = store.life?.canFinance(listing) ?? false
                    let affordable = (store.life?.money ?? 0) >= listing.price || canFinance
                    Button {
                        if canFinance {
                            pending = listing
                        } else {
                            buy(listing, financed: false)
                        }
                    } label: {
                        HStack {
                            Text(kind.emoji).font(.title2)
                            Text(listing.name).font(.body.weight(.medium))
                            Spacer()
                            Text(formatMoney(listing.price))
                                .font(.callout.monospacedDigit())
                                .foregroundStyle(affordable ? Color.lifeGreen : Color.red)
                        }
                    }
                    .foregroundStyle(.primary)
                    .disabled(!affordable)
                }
            }
        }
        .confirmationDialog(
            pending.map { "Buy the \($0.name)?" } ?? "",
            isPresented: Binding(get: { pending != nil }, set: { if !$0 { pending = nil } }),
            titleVisibility: .visible,
            presenting: pending
        ) { listing in
            if (store.life?.money ?? 0) >= listing.price {
                Button("Pay \(formatMoney(listing.price)) cash") { buy(listing, financed: false) }
            }
            Button("Mortgage (\(formatMoney(listing.price / 5)) down)") { buy(listing, financed: true) }
        }
        .navigationTitle(title)
        .onAppear { if listings.isEmpty { listings = Life.marketListings(kind: kind) } }
    }

    private var title: String {
        switch kind {
        case .house: return "Real Estate"
        case .car: return "Car Dealership"
        case .boat: return "Boat Dealership"
        }
    }

    private func buy(_ listing: AssetListing, financed: Bool) {
        let owned = store.life?.assets.count ?? 0
        store.run { $0.buy(listing, financed: financed) }
        if (store.life?.assets.count ?? 0) > owned {
            listings.removeAll { $0.id == listing.id }
        }
    }
}
