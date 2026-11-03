# Ranked squads — reviewed 3 November 2026

These are recommendations for Faberzen's saved roster, not global meta rankings or guaranteed counters. The baseline is the saved 21 October TW/GAC plan, rechecked against the 2 November 2026, 09:05 AEDT roster (over 24 hours old at review). The main 5v5 list preserves its eleven allocations. BAM and Bastila are additions in the projects section, not replacements.

## Ranking method

The numbered list is a curated order of general usefulness with the current roster: established synergy, character investment, completeness and the user's reported battle experience. Nearby positions are judgment calls. It is not a GP score, simulated win rate, deployment list or farm priority. Check the actual opponent before selecting the lowest-cost safe counter. Live roster refresh updates gear, stars, equipped-mod counts and mod-level warnings, but does not automatically re-rank squads or verify speed, abilities, datacrons, defence assignments or available attacks.

SLKR is now R6 with six level-15 6-dot mods; Grievous is now 6★/R5. They remain unranked readiness projects for specific reasons: SLKR purchased abilities/ultimate are unresolved by the export, while all six Grievous mods are below level 15. Do not promote them using finished-kit counter assumptions. Six equipped mods means full slots, not battle readiness. Manual notes are dated and must be reviewed after major upgrades.

## Main 5v5 order

1. Great Mothers / Morgan / Spirit / Night Trooper / Death Trooper (Peridea)
2. Hera / Captain Rex / Sabine / Kanan / Chopper
3. Palpatine / Mara Jade / Vader / Shoretrooper / TIE Fighter Pilot
4. Veers / Piett / Moff Gideon / Dark Trooper / Range
5. Bossk / Greef / Mandalorian / Boba / Dengar
6. Kelleran / Master Qui-Gon / Padawan Obi-Wan / Anakin / Ahsoka
7. KRU / Hux / Kylo Ren / Sith Trooper / First Order Stormtrooper
8. Brood Alpha / Poggle / Spy / Soldier / Sun Fac
9. CLS / Chewbacca / Threepio & Chewie / R2-D2 / Old Ben
10. Fifth Brother / Seventh Sister / Ninth Sister / Eighth Brother / Second Sister
11. Chirpa / Wicket / Elder / Logray / Paploo

The available CLS lineup has no Han Solo. It is not ranked as the standard complete CLS squad. Kelleran is assessed without TW-only omicrons in Grand Arena. Phoenix and Empire still require opening-speed checks after the recent failed matchups.

## Main 3v3 order

1. Great Mothers / Morgan / Spirit
2. Hera / Captain Rex / Chopper
3. Palpatine / Mara Jade / Vader
4. Bossk / Greef / Mandalorian
5. Kelleran / Master Qui-Gon / Padawan Obi-Wan
6. Veers / Piett / Dark Trooper
7. KRU / Hux / Sith Trooper
8. Brood Alpha / Spy / Sun Fac
9. CLS / Chewbacca / Threepio & Chewie
10. Fifth Brother / Seventh Sister / Ninth Sister
11. Chirpa / Wicket / Elder

These are three selected units, not shortened descriptions of five-character teams. No character is used twice in a format's main list. Characters can appear in both format lists because 3v3 and 5v5 are separate seasons.

## Readiness review and alternatives

The main rankings above remain conservative coaching judgments after this review: no new battle evidence establishes a different safe order. The following changes are real roster progress, not simulated win rates. No current defence placement or availability is inferred.

| Squad / unit | Newly verified status or gap | Consequence |
|---|---|---|
| SLKR | R6; six level-15 6-dot Speed/Health mods; ability tiers ambiguous, ultimate not evidenced | Gear project completed through R6; finish R7 and verify kit before moving into the main ranking |
| Grievous | 6★/R5; mod levels 1, 12, 12, 3, 12, 12 | Token milestone complete; health/mod-level and key-ability project now |
| Inquisitors | Ninth and Seventh R5; Fifth R2; Eighth/Second R0 | Only three relic prerequisites remain; Seventh/Eighth/Second have level-1 arrows |
| Imperial Troopers | Piett diamond level 1, cross 12; Gideon two mods at 12 | Check effective opener speed and engine abilities before trusting a counter |
| Empire | Mara's six mods level 15; Vader diamond level 3 | Mara sheet speed estimated about 304 (192 base + 93 flat + completed 10% Speed set); no combat speed guarantee |
| BAM | Full slots; Kuiil four level-1 mods, BAM two | Repair mod levels rather than repeating an empty-slot diagnosis |
| Bastila reserve | Full slots; Bastila five mods below 15 | Remains reserve; do not count full slots as a ready team |
| Enoch, 3v3 only | R6 with one level-12 mod | Five empty slots still block reliable use |

**Explicit overlapping alternatives:**

- 5v5 SLKR / Hux / KRU / Sith Trooper / FOST shares **Hux, KRU, Sith Trooper and FOST** with the main KRU team. Switch the allocation; never count both as independent teams.
- 3v3 SLKR / Hux / KRU shares **Hux and KRU** with the main KRU / Hux / Sith Trooper trio. The same restriction applies.
- Grievous / B1 / B2 / MagnaGuard / Droideka, BAM / Kuiil / IG-11 / Cara / L3, and Bastila / Yoda / Ezra / Plo / Mace do not borrow from the main 5v5 list. Their listed 3v3 cores likewise do not duplicate main allocations.
- Enoch / Night Trooper / Death Trooper (Peridea) is a **3v3-only** project. Those troopers are unallocated by the Mothers/Morgan/Spirit trio. In 5v5 both remain protected with Mothers. No Enoch omicron is presumed.

Grievous's 3v3 project uses B1/B2 without MagnaGuard; this changes survivability. The 3v3 Trooper trio has no Gideon or Range; do not transfer its 5v5 opener/assist assumptions.

## Maintenance

Edit `squads.js` to revise coaching order, membership, role or caveats. First member is leader. Set `project: true` for alternatives or builds outside the main allocation. The UI displays live missing-character/mod/gear warnings and explicitly identifies overlaps between projects and main teams. Re-run the squad invariant and dashboard checks when changing lineups.

Reference: [AhnaldT101 5v5 / 3v3 team catalogue](https://www.ahnaldt101.com/swgoh/teams). Used as a composition cross-check; the order above is our roster-specific assessment, not copied global scores. Account roster: `data/dashboard.json`. Existing progression priorities remain in [GOALS.md](GOALS.md).
