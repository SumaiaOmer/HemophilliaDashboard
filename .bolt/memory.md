# Project memory

## Product intent & audience

- React/Vite lookup-management application supporting patient-facing location forms.
- Location hierarchy is State → City → Local Area.
- Patient-form State, City, and Local Area dropdowns are intended to read dynamically from configured lookup records rather than legacy or built-in lists.
- Administrators manage lookup types and items, including parent-child relationships.

## Brand personality & voice

- No project-specific brand language established.
- Use clear, operational labels and explicit hierarchy terminology: “State,” “City,” and “Local Area.”
- Make parent context and loading/empty states understandable in forms.

## Visual design & UX direction

- Preserve existing lookup-manager patterns, JSX/Tailwind styling, React hooks, Lucide icons, and component conventions.
- Keep hierarchy context visible in lookup-item forms and patient location controls.
- City options should depend on the selected State; Local Area options should depend on the selected City.
- Clear dependent-dropdown behavior is important: reset or invalidate descendants when an upstream selection changes, and provide useful loading and empty states.
- Validate the complete flow in the browser, including configured lookup data, dependent selections, and responsive behavior.

## Decisions, constraints & rationale

- Lookup items use `parentId`; relevant endpoints include:
  - `GET /api/Lookups`
  - `GET /api/Lookups/type/{type}`
  - `GET /api/Lookups/parent/{parentId}`
  - CRUD operations at `/api/Lookups/{id}`
- `LookupTypeForm` supports configuring a type’s parent type.
- `LookupItemForm` derives the valid parent level from the selected lookup type and loads valid parent items.
- A per-item child action allows creating a child from a specific parent row; it depends on the child lookup type being configured with the correct parent type.
- Patient forms have not yet been migrated to the new lookup hierarchy. They currently use older location lists and may fall back to a built-in list when data is empty.
- The intended migration is for all patient-form State, City, and Local Area dropdowns to use the administrator-created lookup types/items, with dependent loading through the live API.
- Existing application data may use internal names such as `StateCities` and `CityLocalities`; persisted identifiers must be checked before migration or record creation.
- The lookup code and the supplied API documentation may currently reference different URL conventions. Do not assume the documented endpoints are live until confirmed; surfaced load failures rather than silently treating them as empty data.
- Do not create live State, City, or Local Area records without the user’s concrete list and confirmation.
- Production build remains blocked by a pre-existing missing login-screen image unrelated to lookup hierarchy work.

## Open questions & assumptions

- Confirm that the configured lookup type names are exactly “State,” “City,” and “Local Area,” or determine the required mapping to legacy identifiers.
- Confirm which API version/base paths are live so patient dropdown loading uses the correct endpoints.
- Determine whether patient forms should preserve existing selections when valid, and how to handle records whose legacy location values no longer exist in lookups.
- Verify browser behavior for State → City → Local Area loading, selection changes, empty states, and API errors.
- Confirm whether patient forms should dynamically load all three levels everywhere they currently expose location dropdowns.
- Decide how orphaned children are handled when parent items or types are edited or deleted.
- Confirm whether nesting is limited to the three location levels or should support arbitrary configured depth.