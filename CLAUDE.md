# BowlPlateform — Claude Code Context

## What this repo is

A **3D-printable elevated dog bowl stand** — pure CAD project. There is no web app, no package.json, no build system, no tests, and no CI.

Two design generations exist:
- **Original** (`STL/`, `Dog Bowl Plateform 2.step`) — 32-piece OnShape export. Reference only. Do not modify.
- **Redesign** (`openscad/`) — parametric OpenSCAD project. This is the active work.

---

## Active design — OpenSCAD file map

```
openscad/
├── dog_bowl_platform.scad   ← Entry point: all parameters + assembly + print layout
├── lib/
│   ├── frame.scad           ← tube_profile(), rail_beam()
│   └── joints.scad          ← snap_tab(), snap_slot()
└── parts/
    ├── corner_post.scad     ← corner_post()
    ├── horizontal_rail.scad ← horizontal_rail()
    └── bowl_cradle.scad     ← bowl_cradle()
```

### Parameters (all in `dog_bowl_platform.scad` top section)

| Variable | Default | Purpose |
|----------|---------|---------|
| `bowl_diameter` | 200 | Bowl outer rim diameter (mm) |
| `num_bowls` | 2 | 1 or 2 bowls |
| `bowl_rim` | 25 | Ledge width around each bowl opening |
| `stand_height` | 200 | Floor to top of rail frame (mm) |
| `frame_w` | 20 | Square tube outer dimension (mm) |
| `wall_t` | 3 | Tube wall thickness (mm) |
| `snap_clearance` | 0.25 | Fit tolerance per side — increase to 0.30 on loose printers |
| `explode` | 0 | Set e.g. 30 for exploded assembly view |
| `print_mode` | false | true = lay all parts flat for print-sheet verification |

Part files define modules with matching defaults. The master file always passes **explicit named arguments** on every call — there is no global variable inheritance between files.

### Library modules

**`openscad/lib/frame.scad`**
- `tube_profile(len, w, t, chamfer)` — vertical hollow chamfered-square tube; extrudes along +Z; cross-section centered at XY origin
- `rail_beam(len, w, t, chamfer)` — horizontal version; runs along +X; Y=[-w/2, w/2]; Z=[0, w]

**`openscad/lib/joints.scad`**
- `snap_tab(len, h, w, bump, taper)` — male cantilever snap tab; protrudes in +X from origin; snap bump on +Z face
- `snap_slot(len, h, w, bump, taper, clearance)` — female receiver; subtract inside `difference()`; slot opens in +X from origin; use `rotate()` to orient for other faces

### Part modules

**`corner_post(height, frame_w, wall_t, chamfer, tab_len, snap_bump, tab_taper, snap_cl, foot_dia, foot_h)`**
- Body occupies X=[0,fw], Y=[0,fw], Z=[0,height]
- Slots cut on **all 4 side faces** — all 4 posts are identical, no orientation required
- Slot rotations: +X face `rotate([0,180,0])`, -X face no rotation, +Y face `rotate([0,0,-90])`, -Y face `rotate([0,0,90])`
- Tapered foot pad (cone, d1=foot_dia at Z=0, d2≈fw at Z=foot_h) — self-supporting at print

**`horizontal_rail(len, frame_w, wall_t, chamfer, tab_len, snap_bump, tab_taper)`**
- Tube body: X=[0,len], Y=[-fw/2, fw/2], Z=[0,fw]
- Left snap tab at X=0, protrudes in **-X** (`rotate([0,0,180])`)
- Right snap tab at X=len, protrudes in **+X**
- In assembly: use `rotate([0,0,90])` to turn an X-rail into a Y-rail

**`bowl_cradle(num_bowls, bowl_d, bowl_rim, bowl_depth, cradle_w, cradle_d, wall_t, drain_d)`**
- Solid block with cylindrical bowl pockets opening from the top face
- `cradle_w` and `cradle_d` set to `rail_len_x - clearance` and `rail_len_y - clearance` respectively — cradle drops into the rail frame and rests by gravity
- Prints flat on bed, bowl openings face up

---

## Coordinate conventions

- **Z = up**. Posts extrude in +Z. Rail Z=[0, frame_w] (bottom at Z=0).
- All dimensions in **millimeters**.
- `snap_slot` always defined opening in +X; rotate to face the correct post surface.
- `translate([fw/2, fw/2, 0])` is needed before `tube_profile` calls inside `corner_post` because `tube_profile` centers its cross-section at the XY origin.

---

## How to make changes

**Change a parameter** (bowl size, height, tolerance):
→ Edit the relevant variable in `openscad/dog_bowl_platform.scad` top section. Derived variables update automatically.

**Change part geometry** (e.g. add a rib to the rail):
→ Edit the relevant `openscad/parts/*.scad` file. Keep the module signature and its default values in sync with what `dog_bowl_platform.scad` passes.

**Add a new module** (e.g. a mid-height cross-brace):
→ Add it to `openscad/lib/frame.scad` or a new `openscad/parts/` file, then call it from `assembly()` in the master file.

**Export STL for printing:**
```bash
openscad -o corner_post.stl    openscad/parts/corner_post.scad
openscad -o horizontal_rail.stl openscad/parts/horizontal_rail.scad
openscad -o bowl_cradle.stl    openscad/parts/bowl_cradle.scad
```

**Preview in OpenSCAD GUI:**
- Open `openscad/dog_bowl_platform.scad` → F5 (fast preview) or F6 (full render)
- Set `explode = 30` for exploded view
- Set `print_mode = true` for flat print-sheet layout

---

## Design constraints — must preserve

1. **100% printed** — no bolts, nuts, rubber feet, inserts, or any purchased hardware
2. **Tool-free** — all joints snap/release by hand; no screwdriver, wrench, or mallet
3. **No supports** — every part prints in its stated orientation without support material
4. **Identical posts** — slots on all 4 faces; no labelling or orientation required during assembly

---

## Original design (reference only)

| File | Description |
|------|-------------|
| `STL/` | 32 individual STL files from the OnShape export |
| `Dog Bowl Plateform 2.step` | Full OnShape STEP assembly (AP242 format) |

Original dimensions: 556.5 W × 258.2 D × 476.0 H mm, 10×10 mm frame, no defined joints.
