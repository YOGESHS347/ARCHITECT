import fs from 'fs';
import { migrateLegacyToCanonical } from '../frontend/src/modules/editor/geometry/migration';
import { validateCanonicalDocument } from '../frontend/src/modules/editor/geometry/validators';

const raw = JSON.parse(fs.readFileSync('scratch/sample_layout.json', 'utf8'));
const canonical = migrateLegacyToCanonical(raw, 30, 40, 'east');
console.log('Levels:', canonical.levels.length);
const lvl0 = canonical.levels[0];
console.log('Nodes count:', lvl0.nodes.length);
console.log('Walls count:', lvl0.walls.length);
console.log('Rooms count:', lvl0.rooms.length);

const validation = validateCanonicalDocument(canonical);
console.log('Validation valid:', validation.valid);
console.log('Validation issues count:', validation.issues.length);
for (const issue of validation.issues) {
  console.log(`[${issue.severity}] ${issue.code}: ${issue.message} (entity: ${issue.entityId})`);
}
