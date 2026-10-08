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
                                Text("Bought for \(formatMoney(asset.purchasePrice))")
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
                            ActionRow(emoji: "🚘", title: "Car Dealership", subtitle: "Buy a ride")
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

    var body: some View {
        List {
            Section {
                LabeledContent("Bank Balance", value: formatMoney(store.life?.money ?? 0))
            }
            Section {
                ForEach(listings) { listing in
                    let affordable = (store.life?.money ?? 0) >= listing.price
                    Button {
                        store.run { $0.buy(listing) }
                        listings.removeAll { $0.id == listing.id }
                    } label: {
                        HStack {
                            Text(kind == .house ? "🏠" : "🚗").font(.title2)
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
        .navigationTitle(kind == .house ? "Real Estate" : "Car Dealership")
        .onAppear { if listings.isEmpty { listings = Life.marketListings(kind: kind) } }
    }
}
