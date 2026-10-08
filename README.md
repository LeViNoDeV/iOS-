# LifeSim

A BitLife-style life simulator for iOS, written in SwiftUI. You're born with random stats, family, and hometown, then tap **Age +** to live year by year: go to school, get a job, fall in love, buy a house, commit crimes, and eventually die.

## Requirements

- Xcode 16 or later
- iOS 17 or later (iPhone)

## Running it

1. Open `LifeSim.xcodeproj` in Xcode.
2. Pick an iPhone simulator, or your own device. For a device, choose your team under **Signing & Capabilities**.
3. Press **⌘R**.

## Features

- **Random or custom lives**: name, gender, hometown, parents and siblings.
- **Stats**: Happiness, Health, Smarts and Looks, which change with age, events and your choices.
- **Year-by-year log** with random events. Some events are choices (bullies, a lost wallet, being asked out, muggers, investment pitches, and more).
- **Education**: elementary and high school, university with 10 majors, and medical, law and business school. Tuition is paid by student loans or by your parents.
- **Careers**: part-time teen jobs and 20+ full-time jobs with education requirements, performance, raises, promotions, firing, and retirement with a pension.
- **Relationships**: parents, siblings, friends, partners, engagement, marriage, divorce, children and pets. Each relationship has a bond meter and its own actions.
- **Activities**: gym, library, meditation, doctor, night club, vacations, plastic surgery, the lottery and the casino.
- **Crime and prison**: shoplifting up to bank robbery, getting caught, sentences, prison riots and escapes.
- **Assets**: buy and sell houses (which appreciate) and cars (which depreciate). Both cost upkeep.
- **Death and graveyard**: lives end from old age, illness or accidents. Past lives are kept in a graveyard.
- **Autosave**: the game is saved to the app's Documents folder after every action.

## Project layout

```
LifeSim/
  App/      App entry point and GameStore (state + persistence)
  Core/     Pure game logic (no UI): models, the Life engine, random events, actions
  Views/    SwiftUI screens
```

The `Core` folder only imports Foundation, so you can tune or test the game rules without touching the UI.
