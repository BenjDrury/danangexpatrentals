/** Vertical padding for full-width sections */
export const SECTION_PADDING = "py-16 sm:py-24";

/** Inner content width — use inside a full-width section so bg runs edge-to-edge */
export const CONTENT_CONTAINER = "mx-auto max-w-6xl px-6";

/** Section + content in one (use when section has no distinct bg, or for simple pages) */
export const SECTION_CLASS = `${CONTENT_CONTAINER} ${SECTION_PADDING}`;
