import fs from 'fs';
import { migrateLegacyToCanonical } from '../frontend/src/modules/editor/geometry/migration';

const raw = JSON.parse(fs.readFileSync('scratch/sample_layout.json', 'utf8'));
const canonical = migrateLegacyToCanonical(raw, 30, 40, 'east');
const lvl0 = canonical.levels[0];

const nodeMap = new Map(lvl0.nodes.map(n => [n.id, n]));

function wallInfo(id: string) {
  const w = lvl0.walls.find(w => w.id === id);
  if (!w) return `Not found: ${id}`;
  const n1 = nodeMap.get(w.startNodeId);
  const n2 = nodeMap.get(w.endNodeId);
  const rooms = lvl0.rooms.filter(r => r.boundaryNodeIds.includes(w.startNodeId) && r.boundaryNodeIds.includes(w.endNodeId));
  return `${w.id}: (${n1?.x}, ${n1?.y}) -> (${n2?.x}, ${n2?.y}) [Rooms: ${rooms.map(r => r.name).join(', ')}]`;
}

console.log("w_lvl_0_31:", wallInfo("w_lvl_0_31"));
console.log("w_lvl_0_34:", wallInfo("w_lvl_0_34"));
console.log("w_lvl_0_32:", wallInfo("w_lvl_0_32"));
console.log("w_lvl_0_35:", wallInfo("w_lvl_0_35"));
console.log("w_lvl_0_41:", wallInfo("w_lvl_0_41"));
