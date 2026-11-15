from pathlib import Path
import struct
import zlib


def chunk(kind, data):
    return struct.pack(">I", len(data)) + kind + data + struct.pack(">I", zlib.crc32(kind + data))


def png(size):
    pixels = bytearray()
    for y in range(size):
        pixels.append(0)
        for x in range(size):
            u, v = x / size, y / size
            color = (17, 107, 98, 255)
            if (.21 < u < .79 and .34 < v < .75) or (.37 < u < .63 and .24 < v < .38):
                color = (240, 250, 247, 255)
            if .42 < u < .58 and .29 < v < .36:
                color = (17, 107, 98, 255)
            if .23 < u < .77 and .49 < v < .53:
                color = (17, 107, 98, 255)
            if .46 < u < .54 and .46 < v < .58:
                color = (227, 190, 119, 255)
            pixels.extend(color)
    header = struct.pack(">IIBBBBB", size, size, 8, 6, 0, 0, 0)
    return b"\x89PNG\r\n\x1a\n" + chunk(b"IHDR", header) + chunk(b"IDAT", zlib.compress(bytes(pixels), 9)) + chunk(b"IEND", b"")


destination = Path(__file__).resolve().parents[1] / "src-tauri/icons"
destination.mkdir(parents=True, exist_ok=True)
sizes = [16, 24, 32, 48, 64, 128, 256]
images = [png(size) for size in sizes]
offset = 6 + 16 * len(sizes)
entries = bytearray()
for size, data in zip(sizes, images):
    entries.extend(struct.pack("<BBBBHHII", size % 256, size % 256, 0, 0, 1, 32, len(data), offset))
    offset += len(data)
(destination / "icon.ico").write_bytes(struct.pack("<HHH", 0, 1, len(sizes)) + entries + b"".join(images))
(destination / "icon.png").write_bytes(images[-1])
