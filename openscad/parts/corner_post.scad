use <../lib/frame.scad>
use <../lib/joints.scad>

// Square corner post with integrated tapered foot pad.
// Body occupies X=[0,fw], Y=[0,fw], Z=[0,height].
// Slots on all 4 side faces so any corner rotation works.
// Prints vertically (Z-up). No supports needed.
module corner_post(
    height    = 200,
    frame_w   = 20,
    wall_t    = 3,
    chamfer   = 2,
    tab_len   = 15,
    snap_bump = 1.2,
    tab_taper = 1.5,
    snap_cl   = 0.25,
    foot_dia  = 35,
    foot_h    = 8
) {
    tab_h = frame_w * 0.55;
    tab_w = frame_w * 0.70;

    // Slot centered in Z at this height
    slot_zc = height - tab_len - 2 + tab_h/2;

    difference() {
        union() {
            // Post tube: X=[0,fw], Y=[0,fw], Z=[0,height]
            translate([frame_w/2, frame_w/2, 0])
                tube_profile(height, frame_w, wall_t, chamfer);

            // Tapered foot pad: wider base, tapers to post width
            // d1=foot_dia at Z=0, d2≈frame_w+2 at Z=foot_h (smooth join)
            translate([frame_w/2, frame_w/2, 0])
                cylinder(h=foot_h, d1=foot_dia, d2=frame_w+2, $fn=64);
        }

        // ── Slot on +X face (opens from X=fw inward in -X) ──────────
        translate([frame_w+0.1, frame_w/2, slot_zc])
            rotate([0, 180, 0])
                snap_slot(tab_len, tab_h, tab_w, snap_bump, tab_taper, snap_cl);

        // ── Slot on -X face (opens from X=0 inward in +X) ──────────
        translate([-0.1, frame_w/2, slot_zc])
            snap_slot(tab_len, tab_h, tab_w, snap_bump, tab_taper, snap_cl);

        // ── Slot on +Y face (opens from Y=fw inward in -Y) ──────────
        // rotate([0,0,-90]): local +X → world -Y
        translate([frame_w/2, frame_w+0.1, slot_zc])
            rotate([0, 0, -90])
                snap_slot(tab_len, tab_h, tab_w, snap_bump, tab_taper, snap_cl);

        // ── Slot on -Y face (opens from Y=0 inward in +Y) ──────────
        // rotate([0,0,90]): local +X → world +Y
        translate([frame_w/2, -0.1, slot_zc])
            rotate([0, 0, 90])
                snap_slot(tab_len, tab_h, tab_w, snap_bump, tab_taper, snap_cl);
    }
}
