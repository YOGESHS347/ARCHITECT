import os
import glob
from PIL import Image
import xml.etree.ElementTree as ET

exports_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "exports"))
print(f"Auditing exports in: {exports_dir}\n")

files = os.listdir(exports_dir)
files.sort()

for f in files:
    full_path = os.path.join(exports_dir, f)
    size = os.path.getsize(full_path)
    ext = os.path.splitext(f)[1].lower()
    
    if ext == ".svg":
        try:
            tree = ET.parse(full_path)
            root = tree.getroot()
            tag_count = len(list(root.iter()))
            print(f"[SVG VALID] {f}")
            print(f"  - Size: {size:,} bytes")
            print(f"  - Root tag: {root.tag}")
            print(f"  - Total XML elements: {tag_count}")
            print(f"  - ViewBox: {root.attrib.get('viewBox', root.attrib.get('width', '') + 'x' + root.attrib.get('height', ''))}")
        except Exception as e:
            print(f"[SVG ERROR] {f}: {e}")
            
    elif ext == ".png":
        try:
            with Image.open(full_path) as img:
                print(f"[PNG VALID] {f}")
                print(f"  - Size: {size:,} bytes")
                print(f"  - Dimensions: {img.width} × {img.height} px")
                print(f"  - Format: {img.format}, Mode: {img.mode}")
        except Exception as e:
            print(f"[PNG ERROR] {f}: {e}")
    print()
