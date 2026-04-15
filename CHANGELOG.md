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

- Rays visibility is now controlled via `categories` instead of the `"hide"` color option.

Rays elements must include a `"categories"` field to be togglable in the GUI. The `"hide"` color option has been removed.

Old format:

```json
{ "type": "rays", "points": [...], "layers": [0] }
```

With controls: `{ "blocked_rays": "hide" }`

New format:

```json
{ "type": "rays", "points": [...], "layers": [0], "categories": ["rays-valid"] }
```

With controls: `{ "show_blocked_rays": false }`

Valid category values for rays: `"rays-valid"`, `"rays-blocked"`, `"rays-output"`.

- The `layers` field has been removed from `points` and `rays` elements.

Points and rays visibility is now controlled via `categories` and the `setCategoryVisibility` event. The `layers` field is no longer used. Kinematic joint points must include `"categories": ["kinematic-joint"]` in their data to respond to the GUI visibility toggle.

Old format:

```json
{ "type": "points", "data": [...], "layers": [4] }
```

New format:

```json
{ "type": "points", "data": [...], "categories": ["kinematic-joint"] }
```

- Camera "XY" is now called "2D".