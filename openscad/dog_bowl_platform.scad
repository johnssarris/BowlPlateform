// ============================================================
// Dog Bowl Platform — Parametric OpenSCAD Redesign
// 100% printable · Tool-free snap assembly · Portable
//
// Part count: 10 pieces (3 unique types)
//   4× corner_post  |  4× horizontal_rail  |  1–2× bowl_cradle
//
// Assembly:
//   1. Place 4 posts at corners (any orientation — slots on all faces)
//   2. Snap front + back X-rails into post slots
//   3. Snap left + right Y-rails into post slots
//   4. Drop bowl cradle into the rail frame opening
// Disassembly: lift cradle → squeeze rail tabs → pull rails → lift posts
// ============================================================

// ── Bowl ─────────────────────────────────────────────────────────────
bowl_diameter = 200;   // mm  bowl outer rim diameter
                        //     small: 140  medium: 180  large: 200-230  giant: 250
num_bowls     = 2;     // 1 or 2
bowl_rim      = 25;    // mm  ledge around each bowl opening

// ── Stand ─────────────────────────────────────────────────────────────
stand_height  = 200;   // mm  floor to top of rail frame (cradle rests here)
                        //     small (~10kg): 100  medium: 150  large: 200-250

// ── Frame ─────────────────────────────────────────────────────────────
frame_w       = 20;    // mm  square tube outer dimension (was 10mm)
wall_t        = 3;     // mm  tube wall thickness
chamfer_r     = 2;     // mm  edge chamfer

// ── Snap-Fit Joint ────────────────────────────────────────────────────
tab_len       = 15;    // mm  snap tab length
snap_bump     = 1.2;   // mm  bump height — increase for stronger snap
snap_clearance= 0.25;  // mm  fit tolerance per side; try 0.30 on loose printers

// ── Foot ──────────────────────────────────────────────────────────────
foot_dia      = 35;    // mm  foot pad diameter at base of each post
foot_h        = 8;     // mm  foot pad height

// ── Render control ────────────────────────────────────────────────────
$fn           = 64;
explode       = 0;     // 0=assembled; set e.g. 30 for exploded view
print_mode    = false; // true=lay all parts flat to verify print sizing

// ── Derived (do not edit) ─────────────────────────────────────────────
tab_h    = frame_w * 0.55;   // tab height (Z) — matches slot Z extent
tab_w    = frame_w * 0.70;   // tab width (Y)
tab_taper = 1.5;              // lead-in taper length

// Cradle footprint: two bowls side by side along X, one bowl deep in Y
cradle_w = (num_bowls == 2)
    ? 2*bowl_diameter + 3*bowl_rim
    : bowl_diameter + 2*bowl_rim;
cradle_d = bowl_diameter + 2*bowl_rim;   // always single bowl depth

// Rail inner spans (body between post inner faces)
rail_len_x = cradle_w - snap_clearance*2;  // snug fit in X
rail_len_y = cradle_d - snap_clearance*2;  // snug fit in Y

// Platform outer footprint
base_x = cradle_w + 2*frame_w;
base_y = cradle_d + 2*frame_w;

// Rail Z: slot center at (height - tab_len - 2 + tab_h/2)
// Rail bottom Z = slot_center - frame_w/2 (rail is fw tall, centered on slot)
slot_zc     = stand_height - tab_len - 2 + tab_h/2;
rail_z_bot  = slot_zc - frame_w/2;
rail_top_z  = rail_z_bot + frame_w;       // cradle rests here

// Cradle clearance from rail inner span
cradle_cl   = snap_clearance * 2;

// ── Includes ─────────────────────────────────────────────────────────
use <parts/corner_post.scad>
use <parts/horizontal_rail.scad>
use <parts/bowl_cradle.scad>

// ─────────────────────────────────────────────────────────────────────
// Assembly
// ─────────────────────────────────────────────────────────────────────
module assembly() {
    ex = explode;

    // 4 corner posts, bottom-left corner at given XY
    // All posts are identical — slots on all 4 faces, no rotation needed.
    post_xy = [
        [0,            0           ],
        [base_x-frame_w, 0           ],
        [0,            base_y-frame_w],
        [base_x-frame_w, base_y-frame_w],
    ];
    for (p = post_xy) {
        ex_x = (p[0] == 0 ? -1 : 1) * ex * 0.4;
        ex_y = (p[1] == 0 ? -1 : 1) * ex * 0.4;
        translate([p[0]+ex_x, p[1]+ex_y, 0])
            corner_post(
                height=stand_height, frame_w=frame_w, wall_t=wall_t,
                chamfer=chamfer_r, tab_len=tab_len, snap_bump=snap_bump,
                snap_cl=snap_clearance, foot_dia=foot_dia, foot_h=foot_h
            );
    }

    // X-direction front rail
    // Tube: X=[fw, fw+rail_len_x], Y=[0,fw] (centered at fw/2), Z=[rail_z_bot, rail_z_bot+fw]
    // Left tab enters left post +X face; right tab enters right post -X face.
    translate([frame_w, frame_w/2, rail_z_bot - ex*0.1])
        horizontal_rail(len=rail_len_x, frame_w=frame_w, wall_t=wall_t,
                        chamfer=chamfer_r, tab_len=tab_len,
                        snap_bump=snap_bump, tab_taper=tab_taper);

    // X-direction back rail
    translate([frame_w, base_y-frame_w/2, rail_z_bot - ex*0.1])
        horizontal_rail(len=rail_len_x, frame_w=frame_w, wall_t=wall_t,
                        chamfer=chamfer_r, tab_len=tab_len,
                        snap_bump=snap_bump, tab_taper=tab_taper);

    // Y-direction left rail
    // rotate([0,0,90]) turns the X-rail into a Y-rail:
    //   rail runs Y=[fw, fw+rail_len_y], X=[0,fw] (centered at fw/2)
    translate([frame_w/2, frame_w, rail_z_bot - ex*0.1])
        rotate([0, 0, 90])
            horizontal_rail(len=rail_len_y, frame_w=frame_w, wall_t=wall_t,
                            chamfer=chamfer_r, tab_len=tab_len,
                            snap_bump=snap_bump, tab_taper=tab_taper);

    // Y-direction right rail
    translate([base_x-frame_w/2, frame_w, rail_z_bot - ex*0.1])
        rotate([0, 0, 90])
            horizontal_rail(len=rail_len_y, frame_w=frame_w, wall_t=wall_t,
                            chamfer=chamfer_r, tab_len=tab_len,
                            snap_bump=snap_bump, tab_taper=tab_taper);

    // Bowl cradle: drops into the rail frame, rests on rail top faces
    // Centred in the platform footprint
    cradle_x_ofs = (base_x - cradle_w + cradle_cl) / 2;
    cradle_y_ofs = (base_y - cradle_d + cradle_cl) / 2;
    translate([cradle_x_ofs, cradle_y_ofs, rail_top_z + ex*1.5])
        bowl_cradle(
            num_bowls=num_bowls,
            bowl_d=bowl_diameter,
            bowl_rim=bowl_rim,
            bowl_depth=60,
            cradle_w=cradle_w - cradle_cl,
            cradle_d=cradle_d - cradle_cl,
            wall_t=wall_t
        );
}

// ─────────────────────────────────────────────────────────────────────
// Print layout — all parts flat on a virtual sheet
// ─────────────────────────────────────────────────────────────────────
module print_layout() {
    sp = 15;  // spacing between parts

    // 4× corner posts (vertical — stand them up in slicer)
    for (i = [0:3])
        translate([i*(frame_w+sp), 0, 0])
            corner_post(height=stand_height, frame_w=frame_w, wall_t=wall_t,
                        chamfer=chamfer_r, tab_len=tab_len, snap_bump=snap_bump,
                        snap_cl=snap_clearance, foot_dia=foot_dia, foot_h=foot_h);

    // 2× X-rails (flat, longest axis along X)
    for (i = [0:1])
        translate([i*(rail_len_x+sp), base_x+sp, 0])
            horizontal_rail(len=rail_len_x, frame_w=frame_w, wall_t=wall_t,
                            chamfer=chamfer_r, tab_len=tab_len,
                            snap_bump=snap_bump, tab_taper=tab_taper);

    // 2× Y-rails
    for (i = [0:1])
        translate([i*(rail_len_y+sp), base_x+frame_w+sp*2, 0])
            horizontal_rail(len=rail_len_y, frame_w=frame_w, wall_t=wall_t,
                            chamfer=chamfer_r, tab_len=tab_len,
                            snap_bump=snap_bump, tab_taper=tab_taper);

    // Bowl cradle
    translate([0, base_x+frame_w*3+sp*3, 0])
        bowl_cradle(num_bowls=num_bowls, bowl_d=bowl_diameter, bowl_rim=bowl_rim,
                    bowl_depth=60, cradle_w=cradle_w-cradle_cl,
                    cradle_d=cradle_d-cradle_cl, wall_t=wall_t);
}

// ─────────────────────────────────────────────────────────────────────
if (print_mode) {
    print_layout();
} else {
    assembly();
}
