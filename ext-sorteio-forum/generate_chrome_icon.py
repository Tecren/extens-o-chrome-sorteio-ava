from PIL import Image, ImageDraw
import argparse, os

def hex_to_rgba(h):
    h = h.lstrip('#')
    if len(h) == 3:
        h = ''.join([c*2 for c in h])
    return (int(h[0:2],16), int(h[2:4],16), int(h[4:6],16), 255)


def draw_division_icon(draw, size):
    blue = hex_to_rgba("#44749d")
    white = (255, 255, 255, 255)

    r_outer = size * 0.48
    draw.ellipse((size*0.5 - r_outer, size*0.5 - r_outer,
                   size*0.5 + r_outer, size*0.5 + r_outer), fill=blue)

    bar_h = size * 0.14
    draw.rounded_rectangle(
        (size*0.22, size*0.50 - bar_h/2, size*0.78, size*0.50 + bar_h/2),
        radius=bar_h/2,
        fill=white
    )

    r_dot = size * 0.14

    cx_top = size * 0.41
    cy_top = size * 0.28
    draw.ellipse((cx_top - r_dot, cy_top - r_dot,
                  cx_top + r_dot, cy_top + r_dot), fill=white)

    cx_bottom = size * 0.59
    cy_bottom = size * 0.72
    draw.ellipse((cx_bottom - r_dot, cy_bottom - r_dot,
                  cx_bottom + r_dot, cy_bottom + r_dot), fill=white)


def generate(size, out):
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    draw_division_icon(draw, size)
    img.save(out)


def main():
    p = argparse.ArgumentParser()
    p.add_argument('--out', default='icons')
    a = p.parse_args()

    os.makedirs(a.out, exist_ok=True)

    for s in [16, 48, 128]:
        generate(s, os.path.join(a.out, f'icon_{s}.png'))


if __name__ == '__main__':
    main()