import os
import re
import sys
import zlib
from collections import defaultdict


OBJ_RE = re.compile(rb"(\d+)\s+(\d+)\s+obj(.*?)endobj", re.S)
FONT_REF_RE = re.compile(rb"/(F\d+)\s+(\d+)\s+0\s+R")
TOUNICODE_RE = re.compile(rb"/ToUnicode\s+(\d+)\s+0\s+R")
STREAM_RE = re.compile(rb"stream\r?\n(.*)\r?\nendstream", re.S)
TEXT_RE = re.compile(rb"(?:(-?\d+(?:\.\d+)?)\s+(-?\d+(?:\.\d+)?)\s+Td)|/(F\d+)\s+(-?\d+(?:\.\d+)?)\s+Tf|\[(.*?)\]TJ|<([0-9A-Fa-f]+)>\s*Tj", re.S)
TAG_RE = re.compile(rb"/([A-Za-z0-9#]+)(?:<</MCID\s+\d+>>)?BDC")


def decode_pdf_string(hex_bytes, cmap):
    data = bytes.fromhex(hex_bytes.decode("ascii"))
    chars = []
    for b in data:
        chars.append(cmap.get(b, ""))
    return "".join(chars)


def parse_cmap(stream_bytes):
    cmap = {}
    text = stream_bytes.decode("latin1", "ignore")
    for src, dst in re.findall(r"<([0-9A-Fa-f]+)>\s*<([0-9A-Fa-f]+)>", text):
        if len(src) == 2:
            cmap[int(src, 16)] = bytes.fromhex(dst).decode("utf-16-be", "ignore")
    return cmap


def parse_objects(data):
    objects = {}
    for m in OBJ_RE.finditer(data):
        objects[int(m.group(1))] = m.group(3)
    return objects


def get_stream(obj_bytes):
    m = STREAM_RE.search(obj_bytes)
    if not m:
        return None
    raw = m.group(1)
    try:
        return zlib.decompress(raw)
    except Exception:
        return raw


def extract_lines(pdf_path):
    data = open(pdf_path, "rb").read()
    objects = parse_objects(data)

    cmap_by_font = {}
    for num, obj in objects.items():
        font_name_match = re.search(rb"/Type/Font", obj)
        if not font_name_match:
            continue
        m = TOUNICODE_RE.search(obj)
        if not m:
            continue
        tu_num = int(m.group(1))
        stream = get_stream(objects.get(tu_num, b""))
        if not stream:
            continue
        cmap = parse_cmap(stream)
        cmap_by_font[f"F{len(cmap_by_font)+1}"] = cmap

    page_items = []
    font_maps = {}
    for num, obj in objects.items():
        for name, ref in FONT_REF_RE.findall(obj):
            ref_num = int(ref)
            font_obj = objects.get(ref_num)
            if not font_obj:
                continue
            to_unicode = TOUNICODE_RE.search(font_obj)
            if not to_unicode:
                continue
            cmap_stream = get_stream(objects.get(int(to_unicode.group(1)), b""))
            if cmap_stream:
                font_maps[name.decode()] = parse_cmap(cmap_stream)

    for num, obj in objects.items():
        stream = get_stream(obj)
        if not stream or b"BT" not in stream:
            continue

        current_font = None
        x = 0.0
        y = 0.0
        current_tag = None
        for tag_m in TAG_RE.finditer(stream):
            pass

        idx = 0
        while idx < len(stream):
            tag_m = TAG_RE.match(stream, idx)
            if tag_m:
                current_tag = tag_m.group(1).decode("latin1")
                idx = tag_m.end()
                continue
            if stream[idx:idx+3] == b"EMC":
                current_tag = None
                idx += 3
                continue
            m = TEXT_RE.match(stream, idx)
            if not m:
                idx += 1
                continue
            idx = m.end()
            if m.group(1) and m.group(2):
                x = float(m.group(1))
                y = float(m.group(2))
            elif m.group(3) and m.group(4):
                current_font = m.group(3).decode()
            elif m.group(5):
                cmap = font_maps.get(current_font or "", {})
                text_bits = []
                for part in re.finditer(rb"<([0-9A-Fa-f]+)>|(-?\d+)", m.group(5)):
                    if part.group(1):
                        text_bits.append(decode_pdf_string(part.group(1), cmap))
                text = "".join(text_bits).strip()
                if text:
                    page_items.append((round(y, 1), round(x, 1), current_tag or "", text))
            elif m.group(6):
                cmap = font_maps.get(current_font or "", {})
                text = decode_pdf_string(m.group(6), cmap).strip()
                if text:
                    page_items.append((round(y, 1), round(x, 1), current_tag or "", text))

    grouped = defaultdict(list)
    for y, x, tag, text in page_items:
        grouped[y].append((x, tag, text))

    lines = []
    for y in sorted(grouped.keys(), reverse=True):
        row = sorted(grouped[y], key=lambda it: it[0])
        parts = []
        for x, tag, text in row:
            parts.append((x, tag, text))
        lines.append((y, parts))
    return lines


def main():
    path = sys.argv[1]
    for y, parts in extract_lines(path):
        joined = " | ".join(f"[{tag}] {text}" if tag else text for _, tag, text in parts)
        print(f"{y:7.1f}: {joined}")


if __name__ == "__main__":
    main()
