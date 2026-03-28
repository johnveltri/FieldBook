# Learnings (Fieldbook / Figma / tooling)

Short, durable notes from integration work so we do not repeat slow failures.

## Figma MCP (`use_figma`)
- **Always use autolayout** Autolayout should be used wherever possible. Only use vertical and horizontal layouts for different containers.
- **Dynamic code execution is unreliable.** The plugin runtime used by MCP often blocks **`new Function(...)`** and **`eval(...)`**. Patterns that decode Base64 and then run the string through either API tend to fail with errors like **`TypeError: not a function`**.
- **Prefer inline plugin code.** Put the actual Plugin API script in the `code` field (or a small static wrapper that does not use `Function`/`eval`). Keep payload under the documented size limit (e.g. ~50k); the Job Card build script alone is small enough.
- **`setPluginData` / `clientStorage`** may be unavailable or restricted in this environment; do not rely on them for multi-step staging across MCP calls.
- **Text node color variables:** use **`figma.variables.setBoundVariableForPaint`** on the text layer’s **fill paint** (`node.fills = [newPaint]`). Calling **`node.setBoundVariable('fills', variable)`** for color can error; paints expect bindings on the paint object.
- **`combineAsVariants`:** if **`Grouped nodes must be in the same page as the parent`** appears when using a **frame** (e.g. Components) as parent, pass the **page** as the combine parent, then **`insertChild`** the resulting component set back into the frame at the desired index.

## Figma Plugin API (layout)

- **`primaryAxisSizingMode` / `counterAxisSizingMode`** accept **`FIXED`** or **`AUTO`** only. Do not assign **`FILL`** or **`HUG`** to those properties; use the correct layout sizing APIs (`layoutSizingHorizontal` / `layoutSizingVertical`, etc.) where the design tool expects “hug” or “fill” behavior.

## Workflow: components in Figma

- **Creating the base frame in Figma first**, then having the assistant **polish, tokenize, and add variants**, is often **faster and more reliable** than long loops of generated plugin code over MCP—especially when the sandbox blocks dynamic execution.
- **Variants** (e.g. job status pills) are straightforward to add once a single good master exists.

## Job Card (design intent)

- **Statuses** to support as variants: NOT STARTED, IN PROGRESS, COMPLETED, PAID, ON HOLD, CANCELED (distinct pill colors per reference).
- **Null / empty fields:** Prefer **omitting** optional lines; baseline empty copy can use placeholders like “Untitled Job”, “No customer •”, “Updated …”, and zeroed metrics where shown.

## Repo artifacts

- Experimental Job Card MCP/plugin scripts under `design-system/scripts/` were **removed** (2026-03-28). Prefer inline `use_figma` code or manual Figma work; see notes above on `eval` / `Function`.
