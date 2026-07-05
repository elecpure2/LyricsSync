"""Generate LyricsSync.ico — rounded dark tile with gradient waveform bars."""
from PIL import Image, ImageDraw

SIZES = [256, 128, 64, 48, 32, 16]


def lerp(a, b, t):
    return tuple(int(a[i] + (b[i] - a[i]) * t) for i in range(3))


def make(size: int) -> Image.Image:
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    r = size * 0.22
    d.rounded_rectangle([0, 0, size - 1, size - 1], radius=r, fill=(14, 16, 21, 255))

    c1, c2 = (125, 211, 252), (244, 114, 182)  # cyan -> pink
    heights = [0.28, 0.55, 0.85, 0.62, 0.38]
    n = len(heights)
    bw = size * 0.10
    gap = (size * 0.72 - n * bw) / (n - 1)
    x = size * 0.14
    for i, h in enumerate(heights):
        t = i / (n - 1)
        col = lerp(c1, c2, t) + (255,)
        bh = size * 0.72 * h
        y0 = (size - bh) / 2
        d.rounded_rectangle([x, y0, x + bw, y0 + bh], radius=bw / 2, fill=col)
        x += bw + gap
    return img


imgs = [make(s) for s in SIZES]
imgs[0].save("LyricsSync.ico", sizes=[(s, s) for s in SIZES],
             append_images=imgs[1:])
print("icon written")
