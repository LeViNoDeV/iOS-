# LifeSim

A BitLife-style life simulator for iOS, written in SwiftUI. You're born with random stats, family, and hometown, then tap **Age +** to live year by year: go to school, get a job, fall in love, buy a house, commit crimes, and eventually die.

## Play on a PC or a phone (web version)

The `web/` folder has the same game as a website that runs in any modern browser (Chrome, Edge, Firefox, Safari).

1. Download the repo (**Code → Download ZIP** on GitHub) and unzip it.
2. Open `web/index.html` in your browser by double-clicking it.

No install or internet connection is needed. Fonts load from Google Fonts when you're online. Your game saves automatically in the browser. Press **Space** to age up.

On a phone it plays like BitLife: your story in the middle, a big **＋ Age** button with **Occupation**, **Assets**, **Relationships** and **Activities** around it, your stats underneath, and menus of tiles that slide up. On a computer it's a full-screen game: a top bar, your character, stats and menu buttons on the left (keys **1**–**4** open the menus), your story in the middle, and the open menu on the right. The layout switches automatically by screen size (phone layout under 1000 pixels wide), or pick **Phone** or **Computer** in Settings (or tap 📱/🖥️ at the top). Hosted on a website, it can be added to a phone's home screen and opens full screen like an app.

The web code mirrors the iOS app's game logic: `engine.js` (aging, health, money, relationships), `events.js` (random events), `actions.js` (everything you can do) and `game-data.js` (jobs, career ladders and work actions, generated from the Swift data). `more-events.js` holds the extra BitLife-style popup events. `mature.js` is the optional 18+ Mature Mode (drinking, drugs and non-explicit sex for adult characters), turned on from the start screen or the Profile tab. `ui.js` and `style.css` are the interface.

More web files:

- `social-plus.js`: friendships, dating and childhood activities.
- `npc.js`: stats for every person (looks, smarts, health, happiness, craziness), stats children inherit from their parents, and meeting people one at a time. When you find a date or make a friend you see their stats first, then choose to ask them out, befriend them or meet someone else.
- `vehicles.js`: real cars, motorcycles, boats, yachts, planes, private jets and helicopters, and the licenses to use them (driver's, motorcycle, boating, captain's, private pilot, jet type rating, helicopter). Lessons, flight hours and days at sea count toward them. Yachts and aircraft can be run by a hired crew instead.
- `realestate.js`: homes with real addresses, sizes, ages and condition; inspections that find hidden problems; mortgages; upkeep, repairs and renovations; renting out; and a housing market that moves prices every year. Well-kept, renovated homes gain value; neglected ones lose it.
- `looks.js` and `ui-looks.js`: appearance. Everyone is drawn as a portrait that ages with them: skin tone, eye color, hair texture and color, 16 hairstyles, facial hair, accessories and outfits. Customize your character when you start a life, change your style at the salon (Profile tab), or edit anyone in God Mode. Children inherit skin tone, eye color, hair texture and natural hair color from their parents, but not accessories, dyes or facial hair.
- `careers.js`: jobs that feel real. Every job has hours, a schedule (day, night, rotating), stress, physical demands, injury risk, a commute (or remote work) and benefits (health insurance, 401(k) match, pension, vacation days). You have a boss with a personality and coworkers in your life. Your job affects your health, happiness and relationships every year. Annual reviews decide raises; three bad reviews and you're fired; recessions bring layoffs and unemployment benefits; burnout, transfers, recruiters and office parties come up as decisions.
- `minigames.js`: skill mini-games (timing, quick math, memory, catch, typing, job interviews) on work actions, interviews, studying, the gym, license tests and crimes. Your score replaces most of the luck. They can be turned off under Settings.
- `godmode.js`: God Mode and the Time Machine.
- `world.js`: all 197 countries you can emigrate to, each with its capital and major cities.
- The expansion packs, on the **🎁 Packs** tab (`packs.js` has the shared parts, `ui-packs.js` the screens):
  - `business.js`, **Boss Mode:** set prices, wages, staffing and marketing; the business has its own bank account, loans, investors and an IPO, and hands you decisions (inspections, strikes, lawsuits, buyout offers).
  - `royalty.js`, **Royalty:** 25 real monarchies with their own titles, succession laws (equal, male-preference, male-only) and powers (constitutional or absolute). Public approval, royal duties, patronages, referendums and unrest.
  - `crime.js`, **Organized Crime:** respect, loyalty and heat; rackets and kick-ups; yearly orders from the family; grand juries; becoming an informant.
  - `zoo.js`, **Pets & Zoo:** pet care costs and lifespans, permits, land and enclosures for exotic animals, and a zoo with exhibits, keepers, habitats, conservation and accreditation.
  - `fame.js`, **Fame:** public image, an agent and a publicist, brand deals and scandals.
  - `prison.js`, **Prison:** jobs, a GED, gangs, appeals with different lawyers, parole after a third of your sentence, and escapes that make you a fugitive.
- `ui-assets.js`: the Money tab, real estate, vehicles and licenses screens.

When you have a baby, adopt a child or get a pet, the game asks you to name them. You can rename children, pets, businesses and zoos later.

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
