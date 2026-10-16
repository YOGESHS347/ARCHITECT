import { migrateLegacyToCanonical } from '../frontend/src/modules/editor/geometry/migration';
import { validateCanonicalDocument } from '../frontend/src/modules/editor/geometry/validators';

// Legacy layout that previously failed with 'Wall w_lvl_0_31 intersects Wall w_lvl_0_34'
const legacyFloors = [
  {
    level: 0,
    name: "Ground Floor",
    rooms: [
      { name: "Master Bedroom", x: 0, y: 0, width: 11, height: 29.46, furniture: [] },
      { name: "Bathroom 1", x: 0, y: 29.46, width: 11, height: 10.54, furniture: [] },
      { name: "Foyer", x: 11, y: 0, width: 8, height: 10.45, furniture: [] },
      { name: "Corridor", x: 11, y: 10.45, width: 8, height: 10.45, furniture: [] },
      { name: "Store Room", x: 11, y: 20.9, width: 8, height: 9.1, furniture: [] },
      { name: "Staircase", x: 11, y: 30.0, width: 8, height: 10.0, furniture: [] },
      { name: "Living Room", x: 19, y: 0, width: 11, height: 12.0, furniture: [] },
      { name: "Dining Room", x: 19, y: 12.0, width: 11, height: 7.0, furniture: [] },
      { name: "Kitchen", x: 19, y: 19.0, width: 11, height: 7.0, furniture: [] },
      { name: "Bedroom 2", x: 19, y: 26.0, width: 11, height: 9.0, furniture: [] },
      // Squeezed rooms from old generator at bottom:
      { name: "Bathroom 2", x: 19, y: 35.0, width: 7.3, height: 5.0, furniture: [] },
      { name: "Walk-in Closet", x: 26.3, y: 35.0, width: 3.7, height: 5.0, furniture: [] },
      { name: "Terrace", x: 19, y: 35.0, width: 11.0, height: 5.0, furniture: [] },
    ]
  }
];

function sanitizeLegacyRooms(rawRooms: any[]) {
  // Check for phantom rooms that are >= 85% covered by other rooms in the same floor
  return rawRooms.filter((r, idx) => {
    const rx1 = r.x, ry1 = r.y, rx2 = r.x + r.width, ry2 = r.y + r.height;
    const rArea = r.width * r.height;
    let coveredArea = 0;

    for (let j = 0; j < rawRooms.length; j++) {
      if (j === idx) continue;
      const o = rawRooms[j];
      const ox1 = o.x, oy1 = o.y, ox2 = o.x + o.width, oy2 = o.y + o.height;
      
      const ix1 = Math.max(rx1, ox1);
      const iy1 = Math.max(ry1, oy1);
      const ix2 = Math.min(rx2, ox2);
      const iy2 = Math.min(ry2, oy2);

      if (ix2 > ix1 && iy2 > iy1) {
        coveredArea += (ix2 - ix1) * (iy2 - iy1);
      }
    }

    if (coveredArea >= rArea * 0.85 && (r.name.toLowerCase().includes('terrace') || r.name.toLowerCase().includes('balcony'))) {
      console.log(`Detected and repaired legacy phantom overlapping room: '${r.name}'`);
      return false;
    }
    return true;
  });
}

const cleanedRooms = sanitizeLegacyRooms(legacyFloors[0].rooms);
const doc = migrateLegacyToCanonical({
  plot_width: 30,
  plot_length: 40,
  entry_direction: 'east',
  floors: [{ ...legacyFloors[0], rooms: cleanedRooms }],
});

const val = validateCanonicalDocument(doc);
console.log('With legacy sanitization: valid =', val.valid);
console.log('Errors count:', val.issues.filter(i => i.severity === 'error').length);

