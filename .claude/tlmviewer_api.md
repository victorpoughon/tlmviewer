# tlmviewer Python API design document

Goals: simple, obvious, type-safe, pythonic, in sync with the tlmviewer protocol.

The API is a thin, direct typed mapping of the protocol and scene element types.
No numpy dependency — callers are expected to call `.tolist()` on any numpy/torch
arrays before passing data in. All types are Python core types.

---

## Data types

### Type aliases

```python
Matrix = list[list[float]]           # 4x4 column-major transform matrix
ClipPlane = tuple[float, float, float, float]  # [nx, ny, nz, d]
```

### Scene

```python
@dataclass
class Scene:
    data: list[SceneElement]
    mode: Literal["3D", "2D"] = "3D"
    camera: str | None = None   # "orthographic" | "perspective" | "2D" | "axial-xy" | ...
    controls: dict[str, Any] = field(default_factory=dict)
```

`camera` and `controls` are untyped — passed through as-is to the JSON payload.

### Element dataclasses

One dataclass per protocol element type. Field names are snake_case; serialization
handles the conversion to camelCase / kebab-case as required by the protocol.

**Lights**

```python
@dataclass
class AmbientLight:
    color: str
    intensity: float

@dataclass
class DirectionalLight:
    color: str
    intensity: float
    position: tuple[float, float, float]
```

**Scene decorations**

```python
@dataclass
class SceneAxis:
    axis: Literal["x", "y", "z"]
    length: float
    color: str

@dataclass
class SceneTitle:
    title: str
```

**Geometry**

```python
@dataclass
class Arrows:
    arrows: list[list[float]]   # each row: [dirX, dirY, [dirZ,] endX, endY, [endZ,] length]

@dataclass
class Points:
    data: list[list[float]]
    color: str
    radius: float
    category: str

@dataclass
class Rays:
    points: list[list[float]]
    color: str
    category: str                                  # "rays-valid" | "rays-blocked" | "rays-output"
    dim: Literal[2, 3] = 3
    variables: dict[str, list[float]] = field(default_factory=dict)
    domain: dict[str, tuple[float, float]] = field(default_factory=dict)

@dataclass
class Box3D:
    size: tuple[float, float, float]
    matrix: Matrix

@dataclass
class Cylinder:
    xmin: float
    xmax: float
    radius: float
    matrix: Matrix
```

**Surfaces**

All surface elements carry a `matrix` (4×4 transform) and an optional list of
`clip_planes`. Serialization maps `clip_planes` → `clipPlanes`.

```python
@dataclass
class SurfaceDisk:
    radius: float
    matrix: Matrix
    clip_planes: list[ClipPlane] = field(default_factory=list)

@dataclass
class SurfaceLathe:
    samples: list[list[float]]
    matrix: Matrix
    clip_planes: list[ClipPlane] = field(default_factory=list)

@dataclass
class SurfaceSphereR:
    R: float
    diameter: float
    matrix: Matrix
    clip_planes: list[ClipPlane] = field(default_factory=list)

@dataclass
class SurfaceSag:
    diameter: float
    sag_function: dict[str, Any]   # e.g. {"sag-type": "spherical", "C": 0.1}
    matrix: Matrix
    clip_planes: list[ClipPlane] = field(default_factory=list)

@dataclass
class SurfaceBSpline:
    points: list[list[list[float]]]
    weights: list[list[float]]
    degree: tuple[int, int]
    knot_type: Literal["clamped", "unclamped"]   # serialized as "knotType"
    samples: tuple[int, int]
    matrix: Matrix
    clip_planes: list[ClipPlane] = field(default_factory=list)
```

### Union type

```python
SceneElement = (
    AmbientLight | DirectionalLight |
    SceneAxis | SceneTitle |
    Arrows | Points | Rays |
    Box3D | Cylinder |
    SurfaceDisk | SurfaceLathe | SurfaceSphereR | SurfaceSag | SurfaceBSpline
)
```

---

## Serialization

`scene_to_dict(scene: Scene) -> dict` converts a `Scene` to a plain dict ready
for JSON serialization. It handles:

- Injecting the `"type"` string field for each element (e.g. `SurfaceDisk` → `"surface-disk"`)
- snake_case → camelCase / kebab-case field name mapping:
  - `clip_planes` → `clipPlanes`
  - `knot_type` → `knotType`
  - `sag_function` → `sag-function`
- Omitting `None` and empty-default fields where the protocol treats them as optional

`sag_function` dicts are passed through as-is (no transformation of keys inside them).

---

## Public functions

```python
def scene_to_dict(scene: Scene) -> dict:
    """Convert a Scene to a JSON-serializable dict."""

def scene_to_json(scene: Scene) -> str:
    """Convert a Scene to a JSON string."""

def save_scene(scene: Scene, path: str) -> None:
    """Save a Scene as a JSON file."""

def push_scene(
    scene: Scene,
    *,
    host: str = "127.0.0.1",
    port: int = 8765,
    topic: str = "main",
) -> None:
    """Push a Scene to a running tlmserver."""
```

All are standalone functions — no class methods. `push_scene` wraps the scene in
a protocol envelope (`v`, `type`, `topic`, `payload`) and POSTs it to tlmserver.

---

## Public API surface (`__init__.py` exports)

```python
from tlmviewer import (
    # Scene container
    Scene,
    # Element types
    AmbientLight, DirectionalLight,
    SceneAxis, SceneTitle,
    Arrows, Points, Rays,
    Box3D, Cylinder,
    SurfaceDisk, SurfaceLathe, SurfaceSphereR, SurfaceSag, SurfaceBSpline,
    # Type aliases
    Matrix, ClipPlane, SceneElement,
    # Functions
    scene_to_dict, scene_to_json, save_scene, push_scene,
)
```

---

## Example usage

```python
import tlmviewer as tlm

scene = tlm.Scene(mode="3D")
scene.data.append(tlm.AmbientLight(color="#ffffff", intensity=1.0))
scene.data.append(tlm.SceneTitle(title="My lens"))
scene.data.append(tlm.SurfaceDisk(
    radius=5.0,
    matrix=[[1,0,0,0],[0,1,0,0],[0,0,1,0],[0,0,0,1]],
))
scene.data.append(tlm.Rays(
    points=[[0,0,0],[1,0,0],[2,0.1,0]],
    color="#ff0000",
    category="rays-valid",
))

tlm.push_scene(scene, topic="main")
# or: tlm.save_scene(scene, "output.json")
```

---

## Package structure

```
python/
  pyproject.toml
  tlmviewer/
    __init__.py       # public exports
    types.py         # Scene, element dataclasses, type aliases
    serialize.py     # scene_to_dict, scene_to_json
    push.py          # push_scene, save_scene
  tests/
    test_serialize.py # round-trip and field mapping tests
    test_push.py      # push_scene error handling (mock HTTP)
```

---

## Integration testing (future work)

Testing that Python-produced JSON is correctly parsed by tlmviewer uses shared JSON fixtures:

- Python tests generate one fixture file per element type into a shared `tests/fixtures/` directory
- TypeScript tests (in `tlmviewer-testing` or a `tlmprotocol` test suite) parse those fixtures using the actual element registry (`descriptor.parse()`)
- In CI, Python generation runs first, TypeScript consumption second
- The fixtures directory acts as a human-readable contract between the two sides and doubles as example scenes for documentation

## Notes

- Python 3.11+ required.
- No dependencies beyond stdlib (`json`, `urllib`, `dataclasses`).
- The `sag_function` dict interior (e.g. `{"sag-type": "spherical", "C": 0.1}`) is
  the user's responsibility — the API does not validate or type-check it.
