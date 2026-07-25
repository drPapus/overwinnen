const fs = require("node:fs");
const path = require("node:path");

const RESOLUTION = [128, 64, 128];
const BOUNDS_MIN = [-1.4, -0.22, -1.4];
const BOUNDS_MAX = [1.4, 0.1, 1.4];
const FLOOR_CENTER = [0, -0.064, 0];
const FLOOR_HALF_SIZE = [1.2, 0.056, 1.2];
const MAX_DISTANCE = 1;
const OUTPUT_DIRECTORY = path.resolve("src/assets/collision");
const BINARY_PATH = path.join(
  OUTPUT_DIRECTORY,
  "floor-collision-volume.bin",
);
const METADATA_PATH = path.join(
  OUTPUT_DIRECTORY,
  "floor-collision-volume.json",
);

// Signed box distance: negative inside, zero at surface, positive outside.
function signedBoxDistance(x, y, z) {
  const qx = Math.abs(x - FLOOR_CENTER[0]) - FLOOR_HALF_SIZE[0];
  const qy = Math.abs(y - FLOOR_CENTER[1]) - FLOOR_HALF_SIZE[1];
  const qz = Math.abs(z - FLOOR_CENTER[2]) - FLOOR_HALF_SIZE[2];
  const outside = Math.hypot(
    Math.max(qx, 0),
    Math.max(qy, 0),
    Math.max(qz, 0),
  );
  const inside = Math.min(Math.max(qx, qy, qz), 0);
  return Math.max(-MAX_DISTANCE, Math.min(MAX_DISTANCE, outside + inside));
}

function main() {
  const [sizeX, sizeY, sizeZ] = RESOLUTION;
  const voxelSize = RESOLUTION.map(
    (resolution, axis) =>
      (BOUNDS_MAX[axis] - BOUNDS_MIN[axis]) / resolution,
  );
  const data = new Float32Array(sizeX * sizeY * sizeZ);
  let insideCount = 0;
  let outsideCount = 0;
  let minimum = Infinity;
  let maximum = -Infinity;
  for (let z = 0; z < sizeZ; z += 1) {
    const worldZ = BOUNDS_MIN[2] + (z + 0.5) * voxelSize[2];
    for (let y = 0; y < sizeY; y += 1) {
      const worldY = BOUNDS_MIN[1] + (y + 0.5) * voxelSize[1];
      for (let x = 0; x < sizeX; x += 1) {
        const worldX =
          BOUNDS_MIN[0] + (x + 0.5) * voxelSize[0];
        const index = x + sizeX * (y + sizeY * z);
        const distance = signedBoxDistance(worldX, worldY, worldZ);
        data[index] = distance;
        if (distance < 0) insideCount += 1;
        else outsideCount += 1;
        minimum = Math.min(minimum, distance);
        maximum = Math.max(maximum, distance);
      }
    }
  }
  if (!data.every(Number.isFinite) || insideCount === 0) {
    throw new Error("Collision volume validation failed.");
  }
  const metadata = {
    sourceGeometry: {
      type: "box",
      name: "ReflectiveFloorCollider",
      center: FLOOR_CENTER,
      halfSize: FLOOR_HALF_SIZE,
    },
    resolution: RESOLUTION,
    boundsMin: BOUNDS_MIN,
    boundsMax: BOUNDS_MAX,
    voxelSize,
    format: "float32",
    channels: 1,
    signConvention: "negative-inside-positive-outside",
    maxDistance: MAX_DISTANCE,
    insideVoxelCount: insideCount,
    outsideVoxelCount: outsideCount,
    minimumDistance: minimum,
    maximumDistance: maximum,
  };
  fs.mkdirSync(OUTPUT_DIRECTORY, { recursive: true });
  fs.writeFileSync(
    BINARY_PATH,
    Buffer.from(data.buffer, data.byteOffset, data.byteLength),
  );
  fs.writeFileSync(
    METADATA_PATH,
    `${JSON.stringify(metadata, null, 2)}\n`,
  );
  console.info("[generateCollisionVolume] Complete", {
    ...metadata,
    binaryBytes: data.byteLength,
  });
}

try {
  main();
} catch (error) {
  console.error("[generateCollisionVolume]", error);
  process.exitCode = 1;
}
