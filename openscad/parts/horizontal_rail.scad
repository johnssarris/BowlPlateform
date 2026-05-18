use <../lib/frame.scad>
use <../lib/joints.scad>

// Horizontal rail with snap tabs on both ends.
// Tube body runs along +X: X=[0,len], Y=[-fw/2,fw/2], Z=[0,fw].
// Left tab protrudes in -X (to enter the left post's +X face).
// Right tab protrudes in +X (to enter the right post's -X face).
// Prints lying flat, longest axis along X. No supports needed.
module horizontal_rail(
    len       = 250,    // inner span between post inner faces
    frame_w   = 20,
    wall_t    = 3,
    chamfer   = 2,
    tab_len   = 15,
    snap_bump = 1.2,
    tab_taper = 1.5
) {
    tab_h = frame_w * 0.55;
    tab_w = frame_w * 0.70;

    union() {
        // Tube body: X=[0,len], Y=[-fw/2,fw/2], Z=[0,fw]
        rail_beam(len, frame_w, wall_t, chamfer);

        // Left tab at X=0, protrudes in -X
        // rotate([0,0,180]): flips +X→-X and +Y→-Y (bump still on top +Z) ✓
        translate([0, 0, frame_w/2])
            rotate([0, 0, 180])
                snap_tab(tab_len, tab_h, tab_w, snap_bump, tab_taper);

        // Right tab at X=len, protrudes in +X
        translate([len, 0, frame_w/2])
            snap_tab(tab_len, tab_h, tab_w, snap_bump, tab_taper);
    }
}
