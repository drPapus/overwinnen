const fs = require("node:fs");
const path = require("node:path");

const MODEL_SCALE = 0.8;
const RESOLUTION = [96, 192, 96];
const PADDING_RATIO = 0.12;
const MAX_DISTANCE = 0.35;
const SOURCE_PATH = path.resolve("src/assets/models/aim-human.glb");
const OUTPUT_DIRECTORY = path.resolve("src/assets/models");
const BINARY_PATH = path.join(OUTPUT_DIRECTORY, "aim-human-sdf.bin");
const METADATA_PATH = path.join(OUTPUT_DIRECTORY, "aim-human-sdf.json");

function readAccessor(json, binary, accessorIndex) {
  const accessor = json.accessors[accessorIndex];
  const view = json.bufferViews[accessor.bufferView];
  const componentSize = {
    5121: 1,
    5123: 2,
    5125: 4,
    5126: 4,
  }[accessor.componentType];
  const components = {
    SCALAR: 1,
    VEC2: 2,
    VEC3: 3,
    VEC4: 4,
  }[accessor.type];
  if (!componentSize || !components || accessor.sparse) {
    throw new Error(`Unsupported GLB accessor ${accessorIndex}.`);
  }
  const stride = view.byteStride || componentSize * components;
  const start = view.byteOffset + (accessor.byteOffset || 0);
  const dataView = new DataView(
    binary.buffer,
    binary.byteOffset,
    binary.byteLength,
  );
  const readers = {
    5121: (offset) => dataView.getUint8(offset),
    5123: (offset) => dataView.getUint16(offset, true),
    5125: (offset) => dataView.getUint32(offset, true),
    5126: (offset) => dataView.getFloat32(offset, true),
  };
  const result = new Array(accessor.count * components);
  for (let index = 0; index < accessor.count; index += 1) {
    for (let component = 0; component < components; component += 1) {
      result[index * components + component] = readers[
        accessor.componentType
      ](start + index * stride + component * componentSize);
    }
  }
  return { data: result, count: accessor.count, components };
}

function parseGlb(buffer) {
  if (buffer.readUInt32LE(0) !== 0x46546c67) {
    throw new Error("Input is not a binary GLB file.");
  }
  let offset = 12;
  let json = null;
  let binary = null;
  while (offset < buffer.length) {
    const length = buffer.readUInt32LE(offset);
    const type = buffer.readUInt32LE(offset + 4);
    const chunk = buffer.subarray(offset + 8, offset + 8 + length);
    if (type === 0x4e4f534a) {
      json = JSON.parse(chunk.toString().replace(/\0/g, "").trim());
    }
    if (type === 0x004e4942) binary = chunk;
    offset += 8 + length;
  }
  if (!json || !binary) throw new Error("GLB JSON or binary chunk missing.");
  return { json, binary };
}

function composeNodeMatrix(THREE, node) {
  if (node.matrix) return new THREE.Matrix4().fromArray(node.matrix);
  const position = new THREE.Vector3().fromArray(
    node.translation || [0, 0, 0],
  );
  const rotation = new THREE.Quaternion().fromArray(
    node.rotation || [0, 0, 0, 1],
  );
  const scale = new THREE.Vector3().fromArray(node.scale || [1, 1, 1]);
  return new THREE.Matrix4().compose(position, rotation, scale);
}

function collectTriangles(THREE, json, binary) {
  const localMatrices = json.nodes.map((node) =>
    composeNodeMatrix(THREE, node),
  );
  const worldMatrices = json.nodes.map(() => new THREE.Matrix4());
  const roots = new Set(json.scenes[json.scene || 0].nodes || []);

  function visit(nodeIndex, parentMatrix) {
    worldMatrices[nodeIndex].multiplyMatrices(
      parentMatrix,
      localMatrices[nodeIndex],
    );
    roots.delete(nodeIndex);
    (json.nodes[nodeIndex].children || []).forEach((child) =>
      visit(child, worldMatrices[nodeIndex]),
    );
  }
  const identity = new THREE.Matrix4();
  [...roots].forEach((root) => visit(root, identity));

  const triangles = [];
  const bounds = new THREE.Box3();
  const a = new THREE.Vector3();
  const b = new THREE.Vector3();
  const c = new THREE.Vector3();
  let meshCount = 0;
  json.nodes.forEach((node, nodeIndex) => {
    if (!Number.isInteger(node.mesh)) return;
    meshCount += 1;
    const mesh = json.meshes[node.mesh];
    mesh.primitives.forEach((primitive) => {
      if ((primitive.mode ?? 4) !== 4) return;
      const positions = readAccessor(
        json,
        binary,
        primitive.attributes.POSITION,
      );
      const indices = Number.isInteger(primitive.indices)
        ? readAccessor(json, binary, primitive.indices).data
        : Array.from({ length: positions.count }, (_, index) => index);
      for (let offset = 0; offset + 2 < indices.length; offset += 3) {
        a.fromArray(positions.data, indices[offset] * 3).applyMatrix4(
          worldMatrices[nodeIndex],
        );
        b.fromArray(positions.data, indices[offset + 1] * 3).applyMatrix4(
          worldMatrices[nodeIndex],
        );
        c.fromArray(positions.data, indices[offset + 2] * 3).applyMatrix4(
          worldMatrices[nodeIndex],
        );
        if (
          new THREE.Triangle(a, b, c).getArea() <=
          Number.EPSILON
        ) {
          continue;
        }
        const triangle = new THREE.Triangle(
          a.clone(),
          b.clone(),
          c.clone(),
        );
        triangles.push(triangle);
        bounds.expandByPoint(triangle.a);
        bounds.expandByPoint(triangle.b);
        bounds.expandByPoint(triangle.c);
      }
    });
  });

  const center = bounds.getCenter(new THREE.Vector3());
  const runtimeMatrix = new THREE.Matrix4()
    .makeScale(MODEL_SCALE, MODEL_SCALE, MODEL_SCALE)
    .setPosition(
      -center.x * MODEL_SCALE,
      -bounds.min.y * MODEL_SCALE,
      0,
    );
  bounds.makeEmpty();
  triangles.forEach((triangle) => {
    triangle.a.applyMatrix4(runtimeMatrix);
    triangle.b.applyMatrix4(runtimeMatrix);
    triangle.c.applyMatrix4(runtimeMatrix);
    bounds.expandByPoint(triangle.a);
    bounds.expandByPoint(triangle.b);
    bounds.expandByPoint(triangle.c);
  });
  return { triangles, bounds, meshCount };
}

function voxelizeSurface(THREE, triangles, bounds, resolution) {
  const [sizeX, sizeY, sizeZ] = resolution;
  const voxelSize = bounds
    .getSize(new THREE.Vector3())
    .divide(new THREE.Vector3(sizeX, sizeY, sizeZ));
  const halfDiagonal = voxelSize.length() * 0.52;
  const surface = new Uint8Array(sizeX * sizeY * sizeZ);
  const triangleBounds = new THREE.Box3();
  const center = new THREE.Vector3();
  const closest = new THREE.Vector3();
  const indexOf = (x, y, z) => x + sizeX * (y + sizeY * z);

  triangles.forEach((triangle, triangleIndex) => {
    triangleBounds.makeEmpty();
    triangleBounds.expandByPoint(triangle.a);
    triangleBounds.expandByPoint(triangle.b);
    triangleBounds.expandByPoint(triangle.c);
    const minX = Math.max(
      0,
      Math.floor((triangleBounds.min.x - bounds.min.x) / voxelSize.x) -
        1,
    );
    const maxX = Math.min(
      sizeX - 1,
      Math.ceil((triangleBounds.max.x - bounds.min.x) / voxelSize.x) +
        1,
    );
    const minY = Math.max(
      0,
      Math.floor((triangleBounds.min.y - bounds.min.y) / voxelSize.y) -
        1,
    );
    const maxY = Math.min(
      sizeY - 1,
      Math.ceil((triangleBounds.max.y - bounds.min.y) / voxelSize.y) +
        1,
    );
    const minZ = Math.max(
      0,
      Math.floor((triangleBounds.min.z - bounds.min.z) / voxelSize.z) -
        1,
    );
    const maxZ = Math.min(
      sizeZ - 1,
      Math.ceil((triangleBounds.max.z - bounds.min.z) / voxelSize.z) +
        1,
    );
    for (let z = minZ; z <= maxZ; z += 1) {
      center.z = bounds.min.z + (z + 0.5) * voxelSize.z;
      for (let y = minY; y <= maxY; y += 1) {
        center.y = bounds.min.y + (y + 0.5) * voxelSize.y;
        for (let x = minX; x <= maxX; x += 1) {
          const voxelIndex = indexOf(x, y, z);
          if (surface[voxelIndex]) continue;
          center.x = bounds.min.x + (x + 0.5) * voxelSize.x;
          triangle.closestPointToPoint(center, closest);
          if (closest.distanceTo(center) <= halfDiagonal) {
            surface[voxelIndex] = 1;
          }
        }
      }
    }
    if ((triangleIndex + 1) % 25000 === 0) {
      console.info(
        `[generateHumanSDF] Voxelized ${triangleIndex + 1}/${triangles.length} triangles`,
      );
    }
  });
  return { surface, voxelSize };
}

function classifyOutside(surface, resolution) {
  const [sizeX, sizeY, sizeZ] = resolution;
  const count = surface.length;
  const outside = new Uint8Array(count);
  const queue = new Int32Array(count);
  let head = 0;
  let tail = 0;
  const indexOf = (x, y, z) => x + sizeX * (y + sizeY * z);
  const enqueue = (x, y, z) => {
    const index = indexOf(x, y, z);
    if (surface[index] || outside[index]) return;
    outside[index] = 1;
    queue[tail++] = index;
  };
  for (let z = 0; z < sizeZ; z += 1) {
    for (let y = 0; y < sizeY; y += 1) {
      enqueue(0, y, z);
      enqueue(sizeX - 1, y, z);
    }
  }
  for (let z = 0; z < sizeZ; z += 1) {
    for (let x = 0; x < sizeX; x += 1) {
      enqueue(x, 0, z);
      enqueue(x, sizeY - 1, z);
    }
  }
  for (let y = 0; y < sizeY; y += 1) {
    for (let x = 0; x < sizeX; x += 1) {
      enqueue(x, y, 0);
      enqueue(x, y, sizeZ - 1);
    }
  }
  while (head < tail) {
    const index = queue[head++];
    const x = index % sizeX;
    const yz = Math.floor(index / sizeX);
    const y = yz % sizeY;
    const z = Math.floor(yz / sizeY);
    if (x > 0) enqueue(x - 1, y, z);
    if (x + 1 < sizeX) enqueue(x + 1, y, z);
    if (y > 0) enqueue(x, y - 1, z);
    if (y + 1 < sizeY) enqueue(x, y + 1, z);
    if (z > 0) enqueue(x, y, z - 1);
    if (z + 1 < sizeZ) enqueue(x, y, z + 1);
  }
  return outside;
}

function edtLine(source, target, length, spacing, work) {
  const { values, indices, boundaries } = work;
  const weight = spacing * spacing;
  let k = -1;
  for (let q = 0; q < length; q += 1) {
    values[q] = source[q];
    if (!Number.isFinite(values[q])) continue;
    let intersection = -Infinity;
    while (k >= 0) {
      const vertex = indices[k];
      intersection =
        (values[q] +
          weight * q * q -
          values[vertex] -
          weight * vertex * vertex) /
        (2 * weight * (q - vertex));
      if (intersection > boundaries[k]) break;
      k -= 1;
    }
    k += 1;
    indices[k] = q;
    boundaries[k] = k === 0 ? -Infinity : intersection;
    boundaries[k + 1] = Infinity;
  }
  if (k < 0) {
    target.fill(Infinity, 0, length);
    return;
  }
  let envelope = 0;
  for (let q = 0; q < length; q += 1) {
    while (boundaries[envelope + 1] < q) envelope += 1;
    const vertex = indices[envelope];
    const delta = q - vertex;
    target[q] = values[vertex] + weight * delta * delta;
  }
}

function distanceTransform(surface, resolution, voxelSize) {
  const [sizeX, sizeY, sizeZ] = resolution;
  let distances = new Float64Array(surface.length);
  for (let index = 0; index < surface.length; index += 1) {
    distances[index] = surface[index] ? 0 : Infinity;
  }
  const maxLength = Math.max(...resolution);
  const source = new Float64Array(maxLength);
  const target = new Float64Array(maxLength);
  const work = {
    values: new Float64Array(maxLength),
    indices: new Int32Array(maxLength),
    boundaries: new Float64Array(maxLength + 1),
  };
  const indexOf = (x, y, z) => x + sizeX * (y + sizeY * z);

  for (let z = 0; z < sizeZ; z += 1) {
    for (let y = 0; y < sizeY; y += 1) {
      for (let x = 0; x < sizeX; x += 1) {
        source[x] = distances[indexOf(x, y, z)];
      }
      edtLine(source, target, sizeX, voxelSize.x, work);
      for (let x = 0; x < sizeX; x += 1) {
        distances[indexOf(x, y, z)] = target[x];
      }
    }
  }
  for (let z = 0; z < sizeZ; z += 1) {
    for (let x = 0; x < sizeX; x += 1) {
      for (let y = 0; y < sizeY; y += 1) {
        source[y] = distances[indexOf(x, y, z)];
      }
      edtLine(source, target, sizeY, voxelSize.y, work);
      for (let y = 0; y < sizeY; y += 1) {
        distances[indexOf(x, y, z)] = target[y];
      }
    }
  }
  for (let y = 0; y < sizeY; y += 1) {
    for (let x = 0; x < sizeX; x += 1) {
      for (let z = 0; z < sizeZ; z += 1) {
        source[z] = distances[indexOf(x, y, z)];
      }
      edtLine(source, target, sizeZ, voxelSize.z, work);
      for (let z = 0; z < sizeZ; z += 1) {
        distances[indexOf(x, y, z)] = target[z];
      }
    }
  }
  return distances;
}

async function main() {
  const THREE = await import("three");
  const { json, binary } = parseGlb(fs.readFileSync(SOURCE_PATH));
  const { triangles, bounds: modelBounds, meshCount } = collectTriangles(
    THREE,
    json,
    binary,
  );
  const largestDimension = modelBounds
    .getSize(new THREE.Vector3())
    .toArray()
    .reduce((maximum, value) => Math.max(maximum, value), 0);
  const padding = largestDimension * PADDING_RATIO;
  const bounds = modelBounds.clone().expandByScalar(padding);
  const { surface, voxelSize } = voxelizeSurface(
    THREE,
    triangles,
    bounds,
    RESOLUTION,
  );
  const outside = classifyOutside(surface, RESOLUTION);
  const squaredDistances = distanceTransform(
    surface,
    RESOLUTION,
    voxelSize,
  );
  const sdf = new Float32Array(surface.length);
  let surfaceCount = 0;
  let outsideCount = 0;
  let insideCount = 0;
  let minimum = Infinity;
  let maximum = -Infinity;
  for (let index = 0; index < sdf.length; index += 1) {
    const unsignedDistance = Math.min(
      Math.sqrt(squaredDistances[index]),
      MAX_DISTANCE,
    );
    if (surface[index]) surfaceCount += 1;
    else if (outside[index]) outsideCount += 1;
    else insideCount += 1;
    sdf[index] = outside[index] || surface[index]
      ? unsignedDistance
      : -unsignedDistance;
    minimum = Math.min(minimum, sdf[index]);
    maximum = Math.max(maximum, sdf[index]);
  }
  const interiorRatio = insideCount / sdf.length;
  if (insideCount === 0 || interiorRatio < 0.005) {
    throw new Error(
      `Interior classification is unreliable (${insideCount} voxels).`,
    );
  }
  if (!sdf.every(Number.isFinite)) {
    throw new Error("Generated SDF contains NaN or infinite values.");
  }

  const metadata = {
    sourceModel: path.relative(process.cwd(), SOURCE_PATH),
    resolution: RESOLUTION,
    boundsMin: bounds.min.toArray(),
    boundsMax: bounds.max.toArray(),
    voxelSize: voxelSize.toArray(),
    format: "float32",
    channels: 1,
    signConvention: "negative-inside-positive-outside",
    maxDistance: MAX_DISTANCE,
    padding,
    meshCount,
    triangleCount: triangles.length,
    surfaceVoxelCount: surfaceCount,
    outsideVoxelCount: outsideCount,
    insideVoxelCount: insideCount,
    unresolvedVoxelCount: 0,
    minimumDistance: minimum,
    maximumDistance: maximum,
  };
  fs.writeFileSync(
    BINARY_PATH,
    Buffer.from(sdf.buffer, sdf.byteOffset, sdf.byteLength),
  );
  fs.writeFileSync(
    METADATA_PATH,
    `${JSON.stringify(metadata, null, 2)}\n`,
  );
  console.info("[generateHumanSDF] Complete", {
    ...metadata,
    binaryBytes: sdf.byteLength,
    interiorPercentage: interiorRatio * 100,
  });
}

main().catch((error) => {
  console.error("[generateHumanSDF]", error);
  process.exitCode = 1;
});
