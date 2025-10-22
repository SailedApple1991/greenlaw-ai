# Citation Format Guide

## How It Works

The GreenLaw AI now supports structured citations with hover tooltips and a separate References section.

## Format for Gemini Response

When Gemini responds, it should use this format:

### Inline Citations
Use the format: `[Citation Name]^[Number]`

Example:
```
The IED as outlined in Directive 2010/75/EU^[1] requires installations to use Best Available Techniques. 
Another important case is Case C-59/89^[2], which clarified environmental protection requirements.
```

### References Section
At the end of the response, add:

```
## References
[1] Directive 2010/75/EU of the European Parliament and of the Council of 24 November 2010 on industrial emissions (integrated pollution prevention and control). Official Journal of the European Union, L 334/17.
[2] Case C-59/89, Commission v Germany (1991) ECR I-2607, also known as the "Grosskrotzenburg" case.
```

## Features

1. **Inline citations** - Blue highlighted badges with citation name and number
2. **Hover tooltips** - Full reference text appears when hovering over citation
3. **References section** - Separate styled section at the bottom with all citations
4. **Markdown support** - Bold text, headers, lists, etc. all render properly

## Example Output

**User sees:**
> The IED as outlined in [Directive 2010/75/EU [1]] requires... (hover shows full citation)

**References Section:**
```
REFERENCES
[1] Directive 2010/75/EU of the European Parliament...
[2] Case C-59/89, Commission v Germany...
```
