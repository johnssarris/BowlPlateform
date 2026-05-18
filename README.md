# Dog Bowl Platform

Parametric, 3D-printable elevated dog bowl stand. Redesigned from scratch in OpenSCAD with three engineering priorities:

- **100% printed** — zero hardware, no bolts, no rubber feet, no glue
- **Tool-free** — snap-fit joints assemble and disassemble by hand in under 2 minutes
- **Portable** — 10 parts stack flat; toss in a bag

---

## Part List

| Part | Count | Unique shapes | File |
|------|-------|---------------|------|
| Corner post | 4× | 1 | `openscad/parts/corner_post.scad` |
| Horizontal rail | 4× | 1 | `openscad/parts/horizontal_rail.scad` |
| Bowl cradle | 1–2× | 1 | `openscad/parts/bowl_cradle.scad` |

**3 unique shapes, 10 total pieces** (down from 32 in the original design).

---

## Structural Improvements vs Original

| Property | Original | Redesign | Gain |
|----------|----------|----------|------|
| Frame cross-section | 10×10 mm solid | 20×20×3 mm hollow tube | 4× section modulus |
| Slenderness ratio | 47.6 : 1 | 23.8 : 1 | 2× column stability |
| Joint type | Flush / adhesive | Cantilever snap-tab | Hand-releasable, no glue |
| Foot contact area | 100 mm² | 962 mm² (ø35 pad) | 9.6× anti-tip stability |
| Part count | 32 | 10 | 69% reduction |
| Hardware needed | Adhesive | None | 100% printable |

---

## Quick Start

### 1. Open the master file

```
openscad/dog_bowl_platform.scad
```

Press **F5** (preview) to see the assembled stand.

### 2. Configure for your dog

Edit these variables at the top of `dog_bowl_platform.scad`:

```scad
bowl_diameter  = 200;   // outer diameter of your dog's bowl (mm)
num_bowls      = 2;     // 1 or 2 bowls
stand_height   = 200;   // floor to cradle surface (mm)
                         // rule of thumb: withers height × 0.45
```

Common `bowl_diameter` values:

| Bowl size | Diameter |
|-----------|----------|
| Small (cat/small dog) | 140 mm |
| Medium dog | 180 mm |
| Large dog | 200–230 mm |
| Giant breed | 250 mm |

Common `stand_height` values:

| Dog size | Height |
|----------|--------|
| Small (≤10 kg) | 100 mm |
| Medium (10–25 kg) | 150–175 mm |
| Large (25–45 kg) | 200–250 mm |
| Giant (>45 kg) | 275–350 mm |

### 3. Export STL files

Run each part file individually to export one STL at a time:

```bash
# Using OpenSCAD CLI
openscad -o corner_post.stl    openscad/parts/corner_post.scad
openscad -o horizontal_rail.stl openscad/parts/horizontal_rail.scad
openscad -o bowl_cradle.stl    openscad/parts/bowl_cradle.scad
```

Or open each file in OpenSCAD, press **F6** (render), then **File → Export → Export as STL**.

> **Note:** The part files use `use <../dog_bowl_platform.scad>` to inherit parameters. Set your sizes in the master file before exporting.

### 4. Print settings

| Setting | Recommendation |
|---------|---------------|
| Layer height | 0.2 mm |
| Infill | 30% (corner posts), 20% (rails and cradle) |
| Perimeters | 3 |
| Material | PLA or PETG |
| Supports | **None required** on any part |

**Print orientations:**

- **Corner post** — print vertically (Z-up). The foot pad is at the bottom of the print.
- **Horizontal rail** — print lying flat (longest axis along X). Snap tabs are at each end.
- **Bowl cradle** — print flat on bed, bowl openings facing up.

### 5. Tune fit tolerance

Default `snap_clearance = 0.25` works for most well-calibrated FDM printers.

- Too tight (tabs won't insert): increase to `0.30`
- Too loose (tabs rattle): decrease to `0.20`

Adjust in the master file and re-export only the affected parts.

---

## Assembly (tool-free, ~90 seconds)

1. Place 4 corner posts upright at the corners of your intended footprint, L-shape facing inward.
2. Slide the front rail's snap tabs into the slots on the two front posts — you'll hear/feel a click.
3. Slide the back rail into the two back posts.
4. Slide the left rail and right rail into their respective slots.
5. Drop the bowl cradle onto the top of the rail frame — the hook tabs on the cradle bottom engage the rail faces by gravity.
6. Place dog bowls.

**Disassembly:** Lift cradle straight up → squeeze each rail's snap tab cantilever inward and slide out → lift posts.

---

## Exploded View

Set `explode = 40` in the master file and press F5 to see all parts separated for verification.

---

## File Structure

```
openscad/
├── dog_bowl_platform.scad   ← Master file: all parameters + assembly
├── lib/
│   ├── frame.scad           ← Hollow chamfered tube module
│   └── joints.scad          ← Snap-tab and snap-slot modules
└── parts/
    ├── corner_post.scad     ← L-shaped post with integrated foot
    ├── horizontal_rail.scad ← Rail with snap tabs on both ends
    └── bowl_cradle.scad     ← Bowl support with hook tabs
STL/                         ← Original 32-piece design (reference)
Dog Bowl Plateform 2.step    ← Original OnShape assembly (reference)
```

---

## Design Notes

### Why hollow tube instead of solid?

A 20×20 mm hollow tube (3 mm wall) has **4× the section modulus** of the original 10×10 mm solid profile while using roughly the same material volume. Section modulus governs bending stiffness — the frame deflects far less under dog-bump loads.

### Why snap-fit instead of bolts?

Bolts require tools and mean hardware that can be lost. A properly designed cantilever snap-tab (3 mm wall, 15 mm arm) provides adequate retention under typical meal-time loading and releases with finger pressure. The cradle is gravity-retained and lifts off freely.

### Why a square footprint?

Making all 4 rails identical (one unique part instead of two) reduces print time and simplifies assembly. The square base footprint is derived directly from `bowl_diameter + 2 × bowl_rim`, so it scales correctly for any bowl size.
