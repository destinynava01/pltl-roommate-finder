# Roommate Finder

A PLTL General Chemistry 1 game (Lewis Lab), for chemical bonding and molecular geometry. The projector shows the
**Octet Arms**, one apartment building per team. Atoms apply to move in as molecules and ions:

| Chemistry | In the game |
|---|---|
| Central atom | The landlord |
| Bond | A shared room (double and triple bonds are bigger shared suites) |
| Lone pair | A private room |
| Octet | 8 beds (H needs 2; B and Be are fine with fewer) |
| Total valence electrons | The deposit, spent exactly |
| VSEPR shape | The floor plan |

Each team gets its own run through the rounds the leader picks, with molecules drawn for that team from a pool of
about 60:

1. **The deposit:** total valence electrons, ions included.
2. **Move-in day:** build the Lewis structure on the phone. Tap bonds to make them single, double or triple, and set
   each atom's lone pairs. A live counter tracks the electrons spent, and each atom shows how many electrons it has.
   Wrong tries say what's off: over the deposit, an outer atom without 8, a period-2 atom over 8, or formal charges
   that aren't the best. Every equivalent resonance structure counts.
3. **House rules:** the formal charge of a highlighted atom, the better of two structures, and either how many
   resonance structures there are or which octet exception applies (odd electrons, fewer than 8, more than 8).
4. **Floor plan:** electron-domain geometry, molecular shape and bond angle, up to seesaw, T-shaped and square planar.
5. **Blanket hog** (optional): which atom gets δ−, and whether the bond is nonpolar, polar or ionic (the slides'
   cutoffs: a difference under 0.5, 0.5 to 2.0, and 2.0 or more).

The best Lewis structure is found by trying every arrangement: formal charges closest to zero first, then any
negative charge on the most electronegative atom (the course's rule). The slides' own worked examples (PCl₃, CH₂O,
O₃, SO₃, BF₃, PF₅, phosphate, F₂, HF, LiF) are left out: the questions are modeled on the class, not copied.
Period-3 oxyanions (like SO₄²⁻ and ClO₃⁻), whose best Lewis structure depends on the textbook, only appear for the
deposit and the floor plan.

Every right answer adds a floor to the team's building, on the projector and on the phones. One student per team is
the **lead leasing agent** and sends each answer; the role rotates every step. Each step is worth 50 points, minus a
quarter per wrong try. After three wrong tries the team can see the answer and move on (0 points). Solved steps build
up as study notes with the Lewis structure and a 3D ball-and-stick floor plan. Optional clock (20, 30 or 45
minutes). The leader can **peek** at any team: its step, the lead, every answer tried, and the answer (behind a
button). Results can be downloaded as an Excel file.

## Pages

| Path | Who | What |
|---|---|---|
| `/` | Leader | Lobby (teams, rounds, clock), then the projector (the buildings and every team's card) and results |
| `/join` | Students | Join with the code, house each applicant, answer when you're the lead leasing agent |

## Setup

1. `npm install`
2. Copy `.env.example` to `.env.local` and fill in the shared PLTL Supabase project's URL and publishable key.
3. `npm run dev`

The backend lives in the `supabase-backend` repository: the tables `rf_*`, the functions `rf-game` and `rf-play`,
and the rules in `_shared/roommateFinder.ts` (tests in `_shared/roommateFinder_test.ts`).
