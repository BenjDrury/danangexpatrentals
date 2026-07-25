/** Vertical padding for full-width sections */
export const SECTION_PADDING = "py-16 sm:py-24";

/**
 * Inner content band — max-width + centered.
 * Section backgrounds stay full-bleed; put this around the content.
 */
export const CONTENT_CONTAINER = "content-band";

/** Section content + padding in one */
export const SECTION_CLASS = `${CONTENT_CONTAINER} ${SECTION_PADDING}`;
