import os
from dotenv import load_dotenv
load_dotenv("backend/.env")

import json
from engines.inference import FloorPlanGenerator

gen = FloorPlanGenerator()
layout = gen.generate_floorplan_json(
    plot_size=1200,
    length=40,
    width=30,
    bedrooms=2,
    bathrooms=2,
    floors=1,
    duplex=0,
    balcony=0,
    terrace=0,
    lift=0,
    vastu=1,
    entry_dir='East'
)
print("Keys:", layout.keys())
floors = layout.get("floors", [])
print(f"Floors count: {len(floors)}")
if floors:
    rooms = floors[0].get("rooms", [])
    print(f"Rooms count in floor 0: {len(rooms)}")
    for i, r in enumerate(rooms):
        print(f"  Room {i}: {r.get('name')} at ({r.get('x')}, {r.get('y')}) {r.get('width')}x{r.get('height')}")

with open("scratch/sample_layout.json", "w") as f:
    json.dump(layout, f, indent=2)
print("Saved to scratch/sample_layout.json")
