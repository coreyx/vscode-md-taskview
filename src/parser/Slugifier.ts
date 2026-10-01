/**
 * Utility for generating heading slugs matching VS Code's built-in Markdown preview anchor rules.
 */
export class Slugifier {
  /**
   * Punctuation characters removed by VS Code and GitHub slugification:
   * Matches VS Code's internal regex: /[^\p{L}\p{M}\p{Nd}\p{Nl}\p{Pc}\- ]/gu
   */
  private static readonly punctuationRegex = /[^\p{L}\p{M}\p{Nd}\p{Nl}\p{Pc}\- ]/gu;

  /**
   * Converts a heading string into a URL-friendly fragment (slug).
   * Matches VS Code's built-in Markdown heading anchor generation.
   */
  public static fromHeading(headingText: string): string {
    return headingText
      .trim()
      .toLowerCase()
      .replace(this.punctuationRegex, '')
      .replace(/\s/g, '-');
  }

  /**
   * Creates a builder that tracks duplicate headings in a document,
   * appending -1, -2, etc. to subsequent occurrences (e.g. intro, intro-1, intro-2).
   */
  public static createBuilder(): { add: (headingText: string) => string } {
    const slugCounts = new Map<string, number>();
    return {
      add: (headingText: string): string => {
        const baseSlug = Slugifier.fromHeading(headingText);
        const count = slugCounts.get(baseSlug);
        if (count !== undefined) {
          const nextCount = count + 1;
          slugCounts.set(baseSlug, nextCount);
          return `${baseSlug}-${nextCount}`;
        } else {
          slugCounts.set(baseSlug, 0);
          return baseSlug;
        }
      },
    };
  }
}
