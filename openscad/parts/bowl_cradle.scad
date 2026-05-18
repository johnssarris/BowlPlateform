// Bowl cradle — drops into the rail frame opening, rests by gravity.
// Outer footprint matches rail inner span (set by caller via cradle_w, cradle_d).
// Prints flat on bed, bowl openings face up. No supports needed.
module bowl_cradle(
    num_bowls = 2,
    bowl_d    = 200,    // outer bowl rim diameter
    bowl_rim  = 25,     // ledge width around bowl opening
    bowl_depth = 60,    // depth of bowl pocket (bowl sinks this far)
    cradle_w  = 250,    // outer width  — set to rail_len_x - clearance
    cradle_d  = 250,    // outer depth  — set to rail_len_y - clearance
    wall_t    = 3,      // floor thickness under bowl
    drain_d   = 5       // drain hole diameter
) {
    cradle_h = bowl_depth + wall_t;

    // Bowl center positions along X
    function bowl_cx(i) =
        (num_bowls == 1) ? cradle_w / 2
        : (i == 0) ? bowl_d/2 + bowl_rim
                   : cradle_w - bowl_d/2 - bowl_rim;

    bowl_cy = cradle_d / 2;

    difference() {
        // Main body
        cube([cradle_w, cradle_d, cradle_h]);

        // Bowl pockets — open from the top face (Z=cradle_h), cut downward
        for (i = [0 : num_bowls-1]) {
            cx = bowl_cx(i);
            // Cylindrical pocket from top down to wall_t floor
            translate([cx, bowl_cy, wall_t])
                cylinder(h = bowl_depth + 0.1, d = bowl_d, $fn=64);
            // 45° chamfered entry lip (eases bowl in, printable without supports)
            translate([cx, bowl_cy, wall_t + bowl_depth - 3])
                cylinder(h=4, d1=bowl_d, d2=bowl_d+6, $fn=64);
            // Drain hole through floor
            translate([cx, bowl_cy, -0.1])
                cylinder(h=wall_t + 0.2, d=drain_d, $fn=32);
        }
    }
}
