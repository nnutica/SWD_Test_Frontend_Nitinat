import { ATTRIBUTE_LIST_ID, SUGGESTED_ATTRIBUTES } from '../lib/attributes'

/** One shared list of attribute suggestions for every condition's Field input. */
export function AttributeSuggestions() {
  return (
    <datalist id={ATTRIBUTE_LIST_ID}>
      {SUGGESTED_ATTRIBUTES.map((attribute) => (
        <option
          key={attribute.name}
          value={attribute.name}
          label={attribute.hint}
        />
      ))}
    </datalist>
  )
}
