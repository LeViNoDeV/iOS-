import SwiftUI

@main
struct LifeSimApp: App {
    @StateObject private var store = GameStore()

    var body: some Scene {
        WindowGroup {
            RootView()
                .environmentObject(store)
        }
    }
}

struct RootView: View {
    @EnvironmentObject private var store: GameStore

    var body: some View {
        Group {
            if let life = store.life {
                if life.isAlive {
                    MainLifeView()
                } else {
                    DeathView(life: life)
                }
            } else {
                NewLifeView()
            }
        }
        .animation(.default, value: store.life?.id)
    }
}
