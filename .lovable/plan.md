

## Plan: Restyle Landing Page + Adjust Stats

Two changes needed:

### 1. Tone down stats to realistic figures
- `$2.1B+` → `$480M+` (Streamer Marketing Spend)
- `14K+` → `2,800+` (Active Casino Streamers)  
- `340M+` → `85M+` (Monthly Gambling Stream Views)

### 2. Restyle the landing page

The current issue from the screenshot: the hero section looks washed out — the dark gradient overlay makes text hard to read, the subtitle is nearly invisible, and the stat cards blend into the background with low contrast.

**Changes to `Index.tsx`:**
- Remove the heavy dark gradient overlay on the hero — use a cleaner solid dark background with subtle accent glow
- Make the hero background fully opaque dark instead of semi-transparent layered gradients
- Improve stat card styling — give them solid borders and better contrast instead of `bg-card/30 backdrop-blur`
- Clean up the nav header — make it fully opaque dark background instead of translucent
- Sharpen typography contrast — subtitle text should be lighter/more visible
- Give CTA buttons more visual weight with slightly larger padding

**Changes to `src/index.css`:**
- Adjust the hero section's background approach — the `.bg-gradient-dark` with `opacity-60` is causing the washed-out look
- No color scheme changes needed (purple/amber is fine), just better application of contrast

This is a styling-only change — no structural or functional modifications.

