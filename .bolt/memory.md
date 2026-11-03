# Project memory

## Product intent & audience

- React/Vite lookup-management application supporting patient-facing location forms.
- Location hierarchy: State → City → Local Area.
- Administrators configure lookup types/items and parent-child relationships; patient forms consume those records dynamically.
- Patient location dropdowns should expose only valid descendants of the selected parent.

## Brand personality & voice

- No project-specific brand language established.
- Use clear operational labels and explicit hierarchy terminology: “State,” “City,” and “Local Area.”
- Explain dependent loading, empty results, and API failures clearly rather than implying missing data is valid.

## Visual design & UX direction

- Preserve existing lookup-manager patterns, JSX/Tailwind styling, React hooks, Lucide icons, and component conventions.
- Keep parent context visible in lookup-item forms and patient location controls.
- State selection filters City options; City selection filters Local Area options.
- Reset or invalidate descendant selections when an upstream value changes.
- Provide useful loading, empty, and error states for dynamically loaded lookup data.
- Verify responsive behavior and the complete hierarchy flow in the browser.

## Decisions, constraints & rationale

- A lookup helper now builds the State → City → Local Area hierarchy from configured lookups.
- The primary patient form’s State, City, and Local Area dropdowns were migrated to lookup-backed data; hard-coded lists and built-in fallbacks were removed.
- The migrated form expects lookup types named `State`, `City` (or `Town`), and `Local Area`, or an equivalent explicit mapping.
- The patient visit form still uses older location lists and remains to be migrated.
- Lookup items use `parentId`; relevant API patterns include:
  - `GET /api/Lookups`
  - `GET /api/Lookups/type/{type}`
  - `GET /api/Lookups/parent/{parentId}`
  - CRUD operations at `/api/Lookups/{id}`
- `LookupTypeForm` supports configuring a type’s parent type. `LookupItemForm` derives the valid parent level and loads valid parent items.
- A per-item child action can create a child from a parent row when the child lookup type is configured correctly.
- Existing application data may use internal names such as `StateCities` and `CityLocalities`; persisted identifiers must be checked before migration or record creation.
- API URL conventions may differ between client code and documentation. Confirm live base paths before treating failed loads as empty data.
- Do not create live State, City, or Local Area records without the user’s concrete list and confirmation.
- Production build remains blocked by a pre-existing missing login-screen image unrelated to lookup hierarchy work.

## Open questions & assumptions

- Confirm exact configured lookup type names and mapping for State, City, and Local Area.
- Confirm which API version/base paths are live; browser testing of the migrated form is still pending.
- Migrate the patient visit form and check for any other location dropdowns still using legacy lists.
- Decide how existing legacy selections should be preserved or handled when no longer present in lookup records.
- Verify selection changes, dependent resets, loading, empty states, API errors, and responsive behavior in the browser.
- Decide how orphaned children are handled when parent items/types are edited or deleted.
- Confirm whether hierarchy depth is limited to the three location levels or should support arbitrary configured nesting.