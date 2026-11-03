# Project memory

## Product intent & audience

- React/Vite application for managing hierarchical location lookup data used in patient-facing forms.
- Primary workflow: create State records, add City records under a State, then add Local Area records under a City.
- Lookup managers support creating, editing, listing, and deleting lookup types and items through the existing API.
- No State, City, or Local Area records have been created from the latest request; record creation should wait for the user’s concrete list and confirmation.

## Brand personality & voice

- No project-specific brand language or tone has been established.
- Use clear, operational copy with familiar terms: “State,” “City,” and “Local Area.”
- Make hierarchy and required parent selections explicit rather than relying on implicit ordering.

## Visual design & UX direction

- Preserve existing lookup-management interaction patterns and styling.
- Present the hierarchy in a clear sequence:
  1. Create or select the State type and add states.
  2. Create or select the City type and add cities under a selected state.
  3. Create or select the Local Area type and add local areas under a selected city.
- Parent selectors must only show valid hierarchy options:
  - City type/items connect to State.
  - Local Area type/items connect to City.
- Preserve existing parent relationships while editing.
- Show parent context in lists, trees, or item forms where available.
- Reuse the project’s JSX, Tailwind, React hooks, Lucide icons, and existing component conventions.
- Avoid ambiguous type naming in the UI; use stable, simple names such as “State,” “City,” and “Local Area” unless existing persisted data requires different identifiers.

## Decisions, constraints & rationale

- Lookup items expose `parentId`; supported endpoints include:
  - `GET /api/Lookups`
  - `GET /api/Lookups/type/{type}`
  - `GET /api/Lookups/parent/{parentId}`
  - CRUD operations at `/api/Lookups/{id}`
- Parent-child lookup support is implemented across the lookup service and forms.
- `LookupTypeForm` supports configuring a type’s parent type instead of always submitting `parentId: 0`.
- `LookupItemForm` derives the valid parent level from the selected lookup type and displays items from that level.
- Intended hierarchy is State → City → Local Area. Existing application data may still contain internal names such as `StateCities` and `CityLocalities`; persisted naming must be verified before migration or record creation.
- Use `/parent/{parentId}` for dependent loading where appropriate to avoid broad client-side filtering.
- Patient forms currently load `StateCities` and `CityLocalities` independently and have not yet been migrated to consume the new parent relationships.
- Existing lookup changes pass type checking.
- Production build remains blocked by a pre-existing missing login-screen image, unrelated to lookup hierarchy work.
- Do not create live records without the user providing the desired states, cities, and local areas and confirming the operation.

## Open questions & assumptions

- Confirm the exact state list and each city/local-area mapping before writing records.
- Confirm whether canonical persisted type names should be `State`, `City`, and `Local Area`, or whether existing internal names must remain.
- Determine whether patient forms should dynamically load cities by selected state and local areas by selected city through `/parent/{parentId}`.
- Confirm whether lookup types are restricted to the three location levels or may be nested more generally.
- Define handling for orphaned children when a parent type or item is edited or deleted.
- Validate browser behavior with existing data, including creation, editing, parent changes, and dependent loading.