# Project memory

## Product intent & audience

- React/Vite lookup-management application for hierarchical location data used by patient-facing forms.
- Core hierarchy: State → City → Local Area.
- Users need to create, edit, list, and delete lookup types/items while preserving parent-child relationships.
- Current workflow issue addressed: adding a child directly under a specific City.

## Brand personality & voice

- No project-specific brand language established.
- Use clear, operational labels and explicit hierarchy terminology: “State,” “City,” and “Local Area.”
- Explain required parent context directly in forms and actions.

## Visual design & UX direction

- Preserve existing lookup-manager patterns, JSX/Tailwind styling, React hooks, Lucide icons, and component conventions.
- Each lookup item may expose a child/sub-item action when a configured child type exists.
- The child action should:
  - Open the new-item form for the child level.
  - Preselect the child lookup type.
  - Preselect the clicked item as the parent.
- Do not show a child action when no child lookup type is configured.
- Keep parent context visible in item forms and lists where practical.
- Parent selectors should only offer valid hierarchy options:
  - City items under State.
  - Local Area items under City.
- Preserve existing parent relationships when editing.
- Prefer dependent loading through `/api/Lookups/parent/{parentId}` where appropriate.
- Validate responsive behavior and browser interaction for the new per-item child flow; code-level checks alone are insufficient.

## Decisions, constraints & rationale

- Lookup items use `parentId`; relevant endpoints include:
  - `GET /api/Lookups`
  - `GET /api/Lookups/type/{type}`
  - `GET /api/Lookups/parent/{parentId}`
  - CRUD operations at `/api/Lookups/{id}`
- `LookupTypeForm` supports configuring a type’s parent type.
- `LookupItemForm` derives the valid parent level from the selected lookup type and loads valid parent items.
- A per-item child/sub-item button was added so a child can be created from the specific City row rather than only creating another item at the current level.
- The new child-entry behavior is implemented and lookup-related type checking reported no errors; browser testing has not yet been completed.
- The child action depends on the child lookup type already existing with the correct parent type. For City → Local Area, “Local Area” must be configured as a child of “City.”
- Existing application data may use internal names such as `StateCities` and `CityLocalities`; verify persisted identifiers before migration or record creation.
- Patient forms currently load legacy location types independently and may not yet use parent-dependent loading.
- Production build remains blocked by a pre-existing missing login-screen image unrelated to lookup hierarchy work.
- Do not create live State, City, or Local Area records without the user’s concrete list and confirmation.

## Open questions & assumptions

- Verify in the browser that the per-item child action appears for City rows and opens a correctly prefilled Local Area form.
- Confirm exact persisted type names and whether legacy names must remain compatible.
- Determine whether patient forms should dynamically load cities by State and local areas by City.
- Decide how orphaned children are handled when parent items or types are edited or deleted.
- Confirm whether lookup nesting is limited to the three location levels or should support arbitrary configured depth.
- Test creation, editing, parent changes, deletion, and dependent loading against existing data.