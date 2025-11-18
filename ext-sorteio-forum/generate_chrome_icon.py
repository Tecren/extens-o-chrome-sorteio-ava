from PIL import Image, ImageDraw
import argparse
import os
import math


def hex_to_rgba(hex_color):
    hex_color = hex_color.lstrip('#')
    if len(hex_color) == 3:
        hex_color = ''.join([c*2 for c in hex_color])
    r = int(hex_color[0:2], 16)
    g = int(hex_color[2:4], 16)
    b = int(hex_color[4:6], 16)
    return (r, g, b, 255)


def draw_circles_icon(draw, size, fg):
    r = size * 0.22
    positions = [
        (size*0.32, size*0.38),
        (size*0.68, size*0.38),
        (size*0.50, size*0.68)
    ]
    for x, y in positions:
        draw.ellipse((x-r, y-r, x+r, y+r), fill=fg)


def draw_nodes_icon(draw, size, fg):
    r = size * 0.16
    nodes = [
        (size*0.30, size*0.30),
        (size*0.70, size*0.30),
        (size*0.50, size*0.70)
    ]
    for i in range(len(nodes)):
        for j in range(i+1, len(nodes)):
            draw.line([nodes[i], nodes[j]], fill=fg, width=int(size*0.08))
    for x, y in nodes:
        draw.ellipse((x-r, y-r, x+r, y+r), fill=fg)


def draw_blocks_icon(draw, size, fg):
    block = size * 0.22
    coords = [
        (size*0.18, size*0.18), (size*0.42, size*0.18), (size*0.66, size*0.18),
        (size*0.30, size*0.58), (size*0.54, size*0.58)
    ]
    for x, y in coords:
        draw.rectangle((x, y, x+block, y+block), fill=fg)


STYLES = {
    "circles": draw_circles_icon,
    "nodes": draw_nodes_icon,
    "blocks": draw_blocks_icon
}


def generate_icon(size, style, bg_color, fg_color, transparent, out_path):
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0) if transparent else bg_color)
    draw = ImageDraw.Draw(img)
    STYLES[style](draw, size, fg_color)
    img.save(out_path)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--style', default='circles', choices=['circles','nodes','blocks'])
    parser.add_argument('--bg', default='#3f4a3c')
    parser.add_argument('--fg', default='#01a50a')
    parser.add_argument('--transparent', action='store_true')
    parser.add_argument('--out', default='icons')
    args = parser.parse_args()

    bg = hex_to_rgba(args.bg)
    fg = hex_to_rgba(args.fg)

    os.makedirs(args.out, exist_ok=True)

    sizes = [16, 48, 128]
    for s in sizes:
        out_file = os.path.join(args.out, f'icon_{s}.png')
        generate_icon(s, args.style, bg, fg, args.transparent, out_file)
        print('Criado', out_file)

if __name__ == '__main__':
    main()
