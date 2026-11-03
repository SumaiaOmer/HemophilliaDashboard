# Project memory

## Product intent & audience

- React/Vite application with lookup management for hierarchical location data.
- Core use case: maintain State → City/Town → Local Area relationships and use them in patient-facing forms.
- Lookup managers support creating, editing, listing, and deleting lookup types/items through the existing API.

## Brand personality & voice

- No project-specific brand language or tone has been established.
- UI copy should remain clear and operational, using familiar location terminology such as “State,” “City/Town,” and “Local Area.”

## Visual design & UX direction

- Preserve the existing application’s lookup-management patterns rather than introducing a separate interaction model.
- Parent selection should be explicit in forms:
  - A lookup type can select its parent type.
  - A lookup item selects a parent item from the level above.
- Parent dropdowns should be filtered to valid hierarchy options, preventing unrelated or same-level selections.
- Forms should retain existing parent relationships when editing instead of silently resetting them.
- Keep hierarchy controls understandable for users managing location data; show the relationship in the manager/tree where available.
- Reuse the project’s existing JSX, Tailwind, hooks, and icon conventions.

## Decisions, constraints & rationale

- Lookup items expose `parentId`; the API supports:
  - `GET /api/Lookups`
  - `GET /api/Lookups/type/{type}`
  - `GET /api/Lookups/parent/{parentId}`
  - CRUD operations at `/api/Lookups/{id}`
- Parent-child lookup support has been added across the lookup service and forms.
- `LookupTypeForm` now preserves/configures a type’s parent type rather than always submitting `parentId: 0`.
- `LookupItemForm` now derives the valid parent level from the selected lookup type and shows items from that parent level.
- Intended hierarchy is State → City/Town → Local Area; the exact persisted type names should remain consistent with the existing application data.
- The patient forms currently load `StateCities` and `CityLocalities` as separate lookup types and have not yet been migrated to consume the new parent relationships.
- The API’s `/parent/{parentId}` endpoint exists but was previously unused by the lookup service; use it where it improves dependent loading or avoids broad client-side filtering.
- Type checking found no errors in the lookup changes.
- Production build remains blocked by a pre-existing missing login-screen image; this is unrelated to lookup hierarchy work.

## Open questions & assumptions

- Confirm the canonical lookup type names and whether existing data uses “City,” “City/Town,” “Local Area,” or internal names such as `StateCities` and `CityLocalities`.
- Determine whether patient forms should dynamically load cities by selected state and local areas by selected city using `/parent/{parentId}`.
- Confirm whether lookup types themselves are intended to be nested arbitrarily or restricted to the three location levels.
- Validate behavior in the browser with existing data, including creating, editing, and changing a type’s parent after child items already exist.
- Decide how the UI should handle orphaned children if a parent type/item is changed or deleted.