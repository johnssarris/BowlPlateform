#!/usr/bin/env python3
"""Generate icon-192.png and icon-512.png from scratch using only stdlib."""
import struct, zlib, math

def png(w, h, pixels):
    """pixels: list of (r,g,b,a) tuples, row-major."""
    def chunk(tag, data):
        c = zlib.crc32(tag + data) & 0xFFFFFFFF
        return struct.pack('>I', len(data)) + tag + data + struct.pack('>I', c)

    raw = b''
    for y in range(h):
        raw += b'\x00'  # filter type: None
        for x in range(w):
            r, g, b, a = pixels[y * w + x]
            raw += bytes([r, g, b, a])

    return (
        b'\x89PNG\r\n\x1a\n' +
        chunk(b'IHDR', struct.pack('>IIBBBBB', w, h, 8, 6, 0, 0, 0)) +
        chunk(b'IDAT', zlib.compress(raw, 9)) +
        chunk(b'IEND', b'')
    )

def draw_icon(size):
    s = size
    pixels = []

    # colours
    BG     = (26,  26,  46,  255)   # #1a1a2e
    POST   = (68, 136, 204,  255)   # #4488cc
    RAIL   = (58, 120, 184,  255)   # #3a78b8
    CRADLE = (42, 104, 168,  255)   # #2a68a8
    HOLE   = (10,  10,  26,  180)   # bowl opening

    def lerp(a, b, t):
        return a + (b - a) * t

    def in_rect(x, y, rx, ry, rw, rh, radius=0):
        if radius == 0:
            return rx <= x < rx + rw and ry <= y < ry + rh
        # rounded rect
        cx = max(rx + radius, min(x, rx + rw - radius))
        cy = max(ry + radius, min(y, ry + rh - radius))
        return (x - cx) ** 2 + (y - cy) ** 2 <= radius ** 2 and \
               rx <= x < rx + rw and ry <= y < ry + rh

    def in_circle(x, y, cx, cy, r):
        return (x - cx) ** 2 + (y - cy) ** 2 <= r ** 2

    # scale helper
    def sc(v):
        return int(round(v * s / 100))

    for y in range(s):
        for x in range(s):
            # background with rounded corners (r=18%)
            r_bg = sc(18)
            in_bg = (
                r_bg <= x < s - r_bg and 0 <= y < s or
                0 <= x < s and r_bg <= y < s - r_bg or
                in_circle(x, y, r_bg, r_bg, r_bg) or
                in_circle(x, y, s - r_bg, r_bg, r_bg) or
                in_circle(x, y, r_bg, s - r_bg, r_bg) or
                in_circle(x, y, s - r_bg, s - r_bg, r_bg)
            )
            if not in_bg:
                pixels.append((0, 0, 0, 0))
                continue

            px = BG

            # left post: x=[16,23], y=[28,72]
            if in_rect(x, y, sc(16), sc(28), sc(7), sc(44)):
                px = POST

            # right post: x=[77,84], y=[28,72]
            if in_rect(x, y, sc(77), sc(28), sc(7), sc(44)):
                px = POST

            # horizontal rail: x=[16,84], y=[46,53]
            if in_rect(x, y, sc(16), sc(46), sc(68), sc(7)):
                px = RAIL

            # cradle top block: x=[22,78], y=[22,48]
            if in_rect(x, y, sc(22), sc(22), sc(56), sc(26), sc(3)):
                px = CRADLE

            # bowl openings (ellipses)
            # left bowl center (37,30), radii (10,8)
            bx1, by1, brx, bry = sc(37), sc(30), sc(10), sc(8)
            if ((x - bx1) / brx) ** 2 + ((y - by1) / bry) ** 2 <= 1:
                px = HOLE

            # right bowl center (63,30)
            bx2 = sc(63)
            if ((x - bx2) / brx) ** 2 + ((y - by1) / bry) ** 2 <= 1:
                px = HOLE

            # foot pads (ellipses at bottom of posts)
            fpx1, fpx2 = sc(19), sc(81)
            fpy = sc(73)
            fprx, fpry = sc(8), sc(3)
            if ((x - fpx1) / fprx) ** 2 + ((y - fpy) / fpry) ** 2 <= 1:
                r2, g2, b2, a2 = POST
                px = (r2, g2, b2, 180)
            if ((x - fpx2) / fprx) ** 2 + ((y - fpy) / fpry) ** 2 <= 1:
                r2, g2, b2, a2 = POST
                px = (r2, g2, b2, 180)

            pixels.append(px)

    return png(s, s, pixels)

for size, name in [(192, 'icon-192.png'), (512, 'icon-512.png')]:
    data = draw_icon(size)
    with open(name, 'wb') as f:
        f.write(data)
    print(f'Generated {name} ({size}×{size}, {len(data)} bytes)')
