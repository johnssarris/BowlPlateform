// Vertical hollow chamfered-square tube.
// Extrudes along +Z from Z=0 to Z=len.
// Cross-section centered at XY origin: X=[-w/2, w/2], Y=[-w/2, w/2].
module tube_profile(len, w, t, chamfer) {
    difference() {
        linear_extrude(len)
            chamfered_square(w, chamfer);
        translate([0, 0, -0.1])
            linear_extrude(len + 0.2)
                chamfered_square(w - 2*t, max(chamfer - t, 0.5));
    }
}

// Horizontal hollow chamfered-square beam.
// Runs along +X from X=0 to X=len.
// Y=[-w/2, w/2], Z=[0, w].
module rail_beam(len, w, t, chamfer) {
    translate([0, 0, w/2])
        rotate([0, 90, 0])          // Z-extrusion → X-extrusion
            tube_profile(len, w, t, chamfer);
}

// 2D chamfered square (octagon), centered at origin.
module chamfered_square(size, ch) {
    s = size / 2;
    c = ch;
    polygon([
        [-s+c,  s  ],
        [ s-c,  s  ],
        [ s,    s-c],
        [ s,   -s+c],
        [ s-c, -s  ],
        [-s+c, -s  ],
        [-s,   -s+c],
        [-s,    s-c]
    ]);
}
