# LifeSim

A BitLife-style life simulator for iOS, written in SwiftUI. You're born with random stats, family, and hometown, then tap **Age +** to live year by year: go to school, get a job, fall in love, buy a house, commit crimes, and eventually die.

## Play on a PC (web version)

The `web/` folder has the same game as a website that runs in any modern browser (Chrome, Edge, Firefox, Safari).

1. Download the repo (**Code → Download ZIP** on GitHub) and unzip it.
2. Open `web/index.html` in your browser by double-clicking it.

No install or internet connection is needed. Fonts load from Google Fonts when you're online. Your game saves automatically in the browser. Press **Space** to age up.

The web code mirrors the iOS app's game logic: `engine.js` (aging, health, money, relationships), `events.js` (random events), `actions.js` (everything you can do) and `game-data.js` (jobs, career ladders and work actions, generated from the Swift data). `more-events.js` holds the extra BitLife-style popup events. `mature.js` is the optional 18+ Mature Mode (drinking, drugs and non-explicit sex for adult characters), turned on from the start screen or the Profile tab. `ui.js` and `style.css` are the interface.

## Requirements (iOS app)

- Xcode 16 or later
- iOS 17 or later (iPhone)

## Running it

1. Open `LifeSim.xcodeproj` in Xcode.
2. Pick an iPhone simulator, or your own device. For a device, choose your team under **Signing & Capabilities**.
3. Press **⌘R**.

## Features

- **Random or custom lives**: name, gender, hometown, parents and siblings.
- **Stats**: Happiness, Health, Smarts, Looks, plus Fame, followers and hidden karma.
- **Year-by-year log** with random events. Many are choices: bullies, prom, being asked out, a lost wallet, muggers, jury duty, celebrities, drunk driving, siblings asking for money, addiction cravings, and more.
- **Education**: elementary and high school (clubs, popularity, skipping school), university with 10 majors, and medical, law and business school.
- **Careers**: part-time teen jobs, 26 full-time jobs, fame careers (actor, musician, pro athlete), the military with deployments, and freelance gigs. Every job has a career ladder (e.g. Junior Developer → … → CTO). Police careers branch after Police Officer into **Patrol**, **Detective** or **SWAT**, each with its own ranks and missions and its own work actions, some of them risky (take a bribe, embezzle, insider trading, lead a raid). You can ask for raises and promotions, get fired, and retire.
- **Relationships that matter**: everyone has a personality trait (kind, generous, funny, ambitious, jealous, lazy, toxic) and adults have jobs. Bonds fade if you neglect people. Your overall social support raises or lowers your happiness every year, and loneliness hurts. Close parents give allowance, pay for college and leave you their money; estranged ones kick you out at 18 and cut you from the will. Spouses share their income, kids cost money but care for you in old age, and a best friend can get you hired. People in your life cause events of their own: partners propose or cheat, parents need care, teens get into trouble, friends need loans, and family reunions happen.
- **Health**: illnesses that drain health, treated by a doctor, specialist, herbalist, witch doctor or therapist. Addictions to alcohol, drugs, gambling or smoking, and rehab.
- **Relationships**: parents, siblings, friends, partners, dating preference, hookups and cheating, engagement, marriage, divorce, children, adoption and pets. You can be nice or mean: compliment, gift, argue, insult, prank, assault, murder.
- **Activities**: gym, library, meditation, martial arts, salon, diets, night clubs, bars, drugs, movies, concerts, vacations, plastic surgery, the lottery and a casino (blackjack, roulette, slots, horse racing). Also social media, a driving test and emigration.
- **Crime and prison**: 8 crimes from shoplifting to train and bank robbery. In prison you can appeal, bribe the warden, riot or try to escape.
- **Assets**: houses (cash or mortgage), cars (need a license) and boats, with value changes and upkeep.
- **Death, ribbons and generations**: each life earns a ribbon (Rich, Famous, Criminal, Saint...). You can continue playing as one of your children and inherit your money. Past lives are kept in a graveyard.
- **Autosave** after every action.

## Installing on an iPhone without a Mac

Every push builds the app on GitHub (see `.github/workflows/build.yml`). Open the repo's **Actions** tab, pick the latest successful **Build** run, and download the **LifeSim-ipa** artifact. Unzip it to get `LifeSim.ipa`, then sideload it with [Sideloadly](https://sideloadly.io) or [AltStore](https://altstore.io) on Windows. With a free Apple ID the app must be reinstalled every 7 days.

## Project layout

```
LifeSim/
  App/      App entry point and GameStore (state + persistence)
  Core/     Pure game logic (no UI): models, the Life engine, random events, actions
  Views/    SwiftUI screens
web/        The same game as a website for PC
```

The `Core` folder only imports Foundation, so you can tune or test the game rules without touching the UI.
