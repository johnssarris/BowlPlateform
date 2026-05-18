// Cantilever snap tab — protrudes in +X from origin.
// Body centered at Y=0, Z=0.
// snap_bump protrudes in +Z (upward).
module snap_tab(len, h, w, bump, taper) {
    // Tapered lead-in tip for easy entry
    hull() {
        cube([0.01,  w*0.75, h*0.70], center=true);
        translate([taper, 0, 0])
            cube([0.01, w, h], center=true);
    }
    // Main body
    translate([taper + (len-taper)/2, 0, 0])
        cube([len-taper, w, h], center=true);
    // Snap bump at 65% of tab length — ramp up, vertical back face
    bx = taper + (len-taper)*0.65;
    translate([bx, 0, h/2])
        linear_extrude(bump)
            polygon([[0,-w*0.4],[bump*2,-w*0.4],[bump*2,w*0.4],[0,w*0.4]]);
    // Angled ramp back down (45° — no overhang)
    translate([bx+bump*2, 0, h/2+bump])
        rotate([0, 45, 0])
            cube([bump*sqrt(2), w*0.8, bump*sqrt(2)], center=true);
}

// Matching slot subtracted from a receiving face.
// Origin at the entry face; slot opens in +X direction.
// clearance is added to each side of the slot opening.
module snap_slot(len, h, w, bump, taper, clearance) {
    sh = h + clearance*2;
    sw = w + clearance*2;
    sl = len + 1;           // 1mm deeper than tab for clearance
    // Open channel
    translate([-0.1, -sw/2, -sh/2])
        cube([sl + 0.2, sw, sh]);
    // Bump recess pocket at same relative position as tab bump
    bx = taper + (len-taper)*0.65;
    translate([bx, -sw/2, sh/2 - clearance])
        cube([bump*3 + clearance*2, sw, bump + clearance*2]);
}
