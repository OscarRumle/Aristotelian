export const REFERENCE_SYNTAX_INSTRUCTION = `
REFERENCE SYNTAX:
When you mention an existing entity (character, object, location, faction, or lore document)
in any prose field, wrap its name in double brackets with the entity type:
  [[Entity Name|character]]
  [[Entity Name|object]]
  [[Entity Name|location]]
  [[Entity Name|faction]]
  [[Entity Name|lore]]

Rules:
- Include this syntax EVERY TIME you mention a named entity that exists in this world.
- Do NOT use it for invented, hypothetical, or background entities that haven't been defined.
- Always include the type hint after the pipe character.
- Whitespace inside brackets is allowed; strip it when reading.

Example:
  "She carried the [[Enchanted Apple|object]] across [[The Shattered Mountains|location]]
   to deliver it to [[Lord Malachi|character]] of [[The Shadow Court|faction]]."

This markup is invisible to the user — the client renders it as interactive links.
`;
