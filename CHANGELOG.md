# tlmviewer changelog

## v0.0.14

### Breaking changes

- "Bounding cylinder" is now a standalone element type `"cylinder"`.

Instead of being defined as a field on surface elements. The old format embedded
cylinder data in surface elements as 

 ```
{ type: "surface-*", bcyl: [xmin, xmax, radius], matrix: ..., ... }
```

The new format is a separate element:

```
{ type: "cylinder", xmin: number, xmax: number, radius: number, matrix: number[][] }
```

- Scene title is now a `"scene-title"` element instead of a top-level `title` field.

Old format:

```json
{ "title": "My Scene", "mode": "2D", "data": [...] }
```

New format:

```json
{ "mode": "2D", "data": [..., { "type": "scene-title", "title": "My Scene" }] }
```
