(() => {
  const limit = __LIMIT__;
  const href = location.href;

  function parseIds(url) {
    const user =
      (url.match(/\/user\/(\d+)/) || url.match(/[?&]id=(\d+)/) || [])[1] || null;
    const group = (url.match(/\/groups\/(\d+)/) || [])[1] || null;
    return { facebookId: user, groupId: group };
  }

  const ids = parseIds(href);
  const BAD_NAMES =
    /^(notifications?|facebook|menu|home|search|marketplace|watch|friends|groups)$/i;

  for (const el of document.querySelectorAll('[role="button"], div[tabindex="0"]')) {
    const t = (el.innerText || "").trim();
    if (/^see more$/i.test(t) || /^xem thêm$/i.test(t)) {
      try {
        el.click();
      } catch (_) {}
    }
  }

  /** Skip aria-hidden / single-char FB accessibility junk. */
  function visibleText(root) {
    if (!root) return "";
    const parts = [];
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode(node) {
        const el = node.parentElement;
        if (!el) return NodeFilter.FILTER_REJECT;
        if (el.closest('[aria-hidden="true"], [hidden], style, script')) {
          return NodeFilter.FILTER_REJECT;
        }
        const t = (node.nodeValue || "").replace(/\s+/g, " ").trim();
        if (!t || t.length === 1) return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      },
    });
    while (walker.nextNode()) {
      parts.push(walker.currentNode.nodeValue.replace(/\s+/g, " ").trim());
    }
    return parts.join(" ").replace(/\s+/g, " ").trim();
  }

  function cleanPartnerName(name) {
    let s = String(name || "").replace(/\s+/g, " ").trim();
    for (let i = 0; i < 4; i++) {
      const next = s
        .replace(
          /^(digital creator|recent photos|photos|group posts|posts|bài viết)\s+/gi,
          ""
        )
        .replace(
          /\s+(digital creator|recent photos|photos|group posts|posts|bài viết)\s*$/gi,
          ""
        )
        .trim();
      if (next === s) break;
      s = next;
    }
    return s;
  }

  function pickName() {
    // Prefer the author immediately before "posted to" on a contribution card.
    const page = visibleText(document.body);
    const posted = page.match(
      /(?:^|[\s>·])([A-Za-zÀ-ỹ][A-Za-zÀ-ỹ'’.\-]{1,40}(?:\s+[A-Za-zÀ-ỹ'’.\-]{1,40}){0,4})\s+posted to\s+/i
    );
    if (posted && posted[1] && !BAD_NAMES.test(posted[1].trim())) {
      const cleaned = cleanPartnerName(posted[1]);
      if (cleaned && !BAD_NAMES.test(cleaned) && cleaned.length <= 80) return cleaned;
    }
    for (const el of document.querySelectorAll("h1, h2")) {
      const t = cleanPartnerName(visibleText(el));
      if (t && t.length >= 2 && t.length <= 80 && !BAD_NAMES.test(t)) return t;
    }
    const title = cleanPartnerName(
      (document.title || "")
        .replace(/\s*[|–—].*$/, "")
        .replace(/\s*-\s*Facebook.*$/i, "")
    );
    if (title && !BAD_NAMES.test(title)) return title;
    return "FB Partner";
  }

  function upgradeAvatarUrl(url) {
    if (!url) return url;
    return url
      .replace(/stp=dst-jpg_fb50_s\d+x\d+/g, "stp=dst-jpg_s720x720")
      .replace(/stp=dst-jpg_s\d{2,3}x\d{2,3}/g, "stp=dst-jpg_s720x720")
      .replace(/ctp=s\d{2,3}x\d{2,3}/g, "ctp=s720x720");
  }

  function isInsidePost(el) {
    // Contribution cards are plain DIVs on group-user pages.
    return Boolean(
      el.closest('[role="article"]') ||
        (el.closest("div") && /posted to/i.test(visibleText(el.closest("div")) || ""))
    );
  }

  function imgSize(el) {
    const nw = Number(el.naturalWidth) || 0;
    const nh = Number(el.naturalHeight) || 0;
    if (nw > 0 && nh > 0) return { w: nw, h: nh };
    const rect = el.getBoundingClientRect?.();
    if (rect && rect.width > 0 && rect.height > 0) {
      return { w: Math.round(rect.width), h: Math.round(rect.height) };
    }
    return { w: 0, h: 0 };
  }

  function avatarScore(el, src, w, h) {
    if (!src || !/scontent|fbcdn/.test(src)) return -1;
    if (/static\.xx\.fbcdn|emoji|rsrc\.php|safe_image/i.test(src)) return -1;
    if (/\/453178253_471506465671661_/i.test(src)) return -1;
    if (/\/t39\.30808-[6-9]\/|\/t1\.6435-[6-9]\//.test(src)) return -1;
    if (el.closest('[role="article"]')) return -1;
    let score = 0;
    if (/\/t39\.30808-1\//.test(src)) score += 100;
    else if (/\/t1\.6435-1\//.test(src)) score += 70;
    const size = Math.max(w, h);
    if (size >= 48 && size <= 320) score += 25;
    else if (size > 900) score -= 40;
    return score;
  }

  function pickLogoUrl() {
    const candidates = [];
    for (const el of document.querySelectorAll("img, image")) {
      const src =
        el.currentSrc ||
        el.src ||
        el.getAttribute("href") ||
        el.getAttribute("xlink:href") ||
        "";
      const { w, h } = imgSize(el);
      const score = avatarScore(el, src, w, h);
      if (score > 0) candidates.push({ src, score, w, h });
    }
    candidates.sort((a, b) => b.score - a.score || Math.max(b.w, b.h) - Math.max(a.w, a.h));
    return candidates[0] ? upgradeAvatarUrl(candidates[0].src) : null;
  }

  function bodyFromCard(raw) {
    let body = (raw || "").replace(/\s+/g, " ").trim();
    body = body.replace(/^[\s\S]{0,140}?posted to\s+.+?(?:·|:|\.)\s*/i, "");
    body = body.replace(/^Shared with Public group\s*/i, "");
    body = body.replace(/\s*\+\d+\s*$/, "").trim();
    return body.slice(0, 4000);
  }

  function cardKey(body) {
    return body
      .toLowerCase()
      .replace(/[^a-z0-9à-ỹ\s]/gi, " ")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 120);
  }

  function isUsableCard(text) {
    if (!text || text.length < 50) return false;
    if (/^(Intro|Group posts|Recent photos|Message|Add friend)/i.test(text)) return false;
    if (/\bcommented on\b/i.test(text)) return false;
    if (/\bshared (a|an|this) (post|link|photo)\b/i.test(text)) return false;
    return true;
  }

  function listingImgs(root) {
    return [...root.querySelectorAll("img")].filter((img) => {
      const s = img.currentSrc || img.src || "";
      if (!/scontent|fbcdn/.test(s)) return false;
      if (/s24x24|s32x32|s40x40|s48x48|s50x50|s60x60|p160x160|static\.xx\.fbcdn/.test(s)) {
        return false;
      }
      return (img.naturalWidth || 0) >= 80;
    });
  }

  function findPermalink(root) {
    if (!root) return null;
    for (const a of root.querySelectorAll("a[href]")) {
      const h = a.href || "";
      if (/\/permalink\/\d+|\/posts\/\d+|story_fbid=\d+|multi_permalinks=\d+/.test(h)) {
        return h.split("?")[0].replace(/\/$/, "");
      }
    }
    return null;
  }

  function postIdFromUrl(url) {
    if (!url) return null;
    const m =
      url.match(/permalink\/(\d+)/) ||
      url.match(/\/posts\/(\d+)/) ||
      url.match(/story_fbid=(\d+)/) ||
      url.match(/multi_permalinks=(\d+)/);
    return m ? m[1] : null;
  }

  /**
   * One contribution = climb from each "posted to" text node to the smallest
   * DIV that holds that post's visible copy + photo tiles.
   */
  function listVisibleCards() {
    const starts = [];
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    while (walker.nextNode()) {
      if (/posted to/i.test(walker.currentNode.nodeValue || "")) {
        starts.push(walker.currentNode);
      }
    }

    const cards = [];
    const seen = new Set();
    for (const node of starts) {
      let el = node.parentElement;
      let best = null;
      for (let i = 0; i < 28 && el; i++) {
        const raw = visibleText(el);
        const posted = (raw.match(/\sposted to\s/gi) || []).length;
        const imgs = listingImgs(el).length;
        if (raw.length >= 100 && raw.length <= 4000 && posted === 1) {
          best = el;
          // Prefer a container that already shows listing photos.
          if (imgs >= 2 && raw.length >= 160) break;
        }
        el = el.parentElement;
      }
      if (!best) continue;
      const raw = visibleText(best);
      const text = bodyFromCard(raw);
      if (!isUsableCard(text)) continue;
      const key = cardKey(text);
      if (!key || seen.has(key)) continue;
      seen.add(key);
      const permalink = findPermalink(best);
      const rect = best.getBoundingClientRect();
      cards.push({
        key,
        text,
        permalink,
        postId: postIdFromUrl(permalink),
        top: Math.round(rect.top),
        hasPhotoTile: listingImgs(best).length > 0,
      });
      if (cards.length >= limit) break;
    }
    cards.sort((a, b) => a.top - b.top);
    return cards;
  }

  return JSON.stringify({
    scrapedAt: new Date().toISOString(),
    pageUrl: href,
    company: {
      name: pickName().slice(0, 500),
      facebookId: ids.facebookId,
      groupId: ids.groupId,
      pageUrl: href,
      logoUrl: pickLogoUrl(),
    },
    cards: listVisibleCards(),
    debug: {
      cardCount: listVisibleCards().length,
    },
  });
})();
