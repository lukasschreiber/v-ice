/**
 * A deep equality comparison between the two provided arrays recursively
 * comparing any child elements that are also arrays.
 *
 * @param a The first array to compare.
 * @param b The second array to compare.
 * @returns Whether the arrays are deeply equivalent.
 * 
 * Copied from: https://github.com/google/blockly-samples/blob/master/plugins/field-dependent-dropdown/src/dependent_dropdown_options_change.ts
 */
export function arraysAreEquivalent<T>(a: T[], b: T[]): boolean {
    return (
      a.length === b.length &&
      a.every((aElement, index) => {
        const bElement = b[index];
        if (Array.isArray(aElement) && Array.isArray(bElement)) {
          return arraysAreEquivalent(aElement, bElement);
        }
        return aElement === bElement;
      })
    );
  }