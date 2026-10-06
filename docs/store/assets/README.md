# Store screenshot & graphic assets

| Asset | Size | Notes |
|-------|------|--------|
| App icon | 1024×1024 PNG | `mobile/assets/icon.png`: lime `#D4FF3F`, black "R" in Bricolage Grotesque, pink dot |
| Android adaptive icon | 512×512 PNGs | `mobile/assets/android-icon-*.png` (foreground inside the 66% safe zone, lime background, white monochrome) |
| Splash | 1024×1024 PNG | `mobile/assets/splash-icon.png` (rounded mark) on `#08080B` |
| Google Play feature graphic | 1024×500 PNG | `feature-graphic.png`, from `feature-graphic-template.svg` (`node scripts/generate-store-assets.mjs`; export with Bricolage Grotesque installed) |
| Android phone screenshots | ≥1080×1920 | Today, Daily results, You (personality), Explore, Match, Chats |
| iPhone 6.7" | 1290×2796 | Same flows |
| iPhone 6.5" | 1242×2688 | Optional second set |

Current screens for reference: `docs/design/preview/`.

**Capture flow**
1. Run API + `cd mobile && npx expo start`
2. Open on device/emulator
3. Screenshot each tab

Suggested captions for overlays (optional):
- "10 films a day. See how everyone voted."
- "Meet your film personality"
- "Find friends who get your taste"
- "Dating, only if you want it"
