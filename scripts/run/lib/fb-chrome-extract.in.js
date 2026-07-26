(() => {
  const limit = __LIMIT__;
  const maxImages = __IMAGES__;
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

  function pickName() {
    const posted = (document.body.innerText || "").match(
      /([A-Za-zÀ-ỹ][A-Za-zÀ-ỹ'’.\- ]{1,60}?)\s+posted to\s+/
    );
    if (posted && posted[1] && !BAD_NAMES.test(posted[1].trim())) {
      return posted[1].trim();
    }
    for (const el of document.querySelectorAll("h1, h2, strong, span")) {
      const t = (el.innerText || "").replace(/\s+/g, " ").trim();
      if (!t || t.length < 2 || t.length > 80) continue;
      if (BAD_NAMES.test(t)) continue;
      if (/unread|notification|message|add friend|view profile|points/i.test(t)) continue;
      if (el.closest('[role="navigation"], [role="banner"], [aria-label*="Notification"]'))
        continue;
      if (/^h[12]$/i.test(el.tagName) && !BAD_NAMES.test(t)) return t;
    }
    const title = (document.title || "")
      .replace(/\s*[|–—].*$/, "")
      .replace(/\s*-\s*Facebook.*$/i, "")
      .trim();
    if (title && !BAD_NAMES.test(title)) return title;
    return "FB Partner";
  }

  const name = pickName();

  const logoImg = [...document.querySelectorAll("img")].find((el) => {
    const src = el.currentSrc || el.src || "";
    const w = el.naturalWidth || 0;
    return /scontent|fbcdn/.test(src) && w >= 80 && w <= 400 && !/static\.xx\.fbcdn/.test(src);
  });
  const logoUrl = logoImg ? logoImg.currentSrc || logoImg.src : null;

  function upgradeImageUrl(url) {
    if (!url) return url;
    return url
      .replace(/ctp=p\d+x\d+/g, "ctp=s2048x2048")
      .replace(/stp=dst-jpg_s\d+x\d+/g, "stp=dst-jpg_s960x960");
  }

  function isListingImage(src, w) {
    if (!src || !/scontent|fbcdn/.test(src)) return false;
    if (/static\.xx\.fbcdn|emoji|rsrc\.php/.test(src)) return false;
    if (
      /s24x24|s32x32|s40x40|s48x48|s50x50|s60x60|s200x200|p160x160|p110x80|ctp=p\d+x\d+|stp=dst-jpg_s\d{2,3}x\d{2,3}/.test(
        src
      )
    )
      return false;
    // Prefer real photo dimensions when known
    if (w > 0 && w < 280) return false;
    return true;
  }

  function imageKey(src) {
    const m = src.match(/\/(\d+_\d+_\d+_n)\./);
    return m ? m[1] : src.split("?")[0];
  }

  function collectImages(root, max) {
    if (!root) return [];
    const ranked = [];

    function add(src, w, h) {
      if (!src) return;
      src = src.replace(/&amp;/g, "&");
      if (!isListingImage(src, w || 0)) return;
      ranked.push({ src: upgradeImageUrl(src), w: w || 0, h: h || 0 });
    }

    for (const img of root.querySelectorAll("img")) {
      const w = img.naturalWidth || 0;
      const h = img.naturalHeight || 0;
      add(img.currentSrc || img.src || "", w, h);
      const srcset = img.getAttribute("srcset") || "";
      for (const part of srcset.split(",")) {
        const u = part.trim().split(/\s+/)[0];
        if (u) add(u, w, h);
      }
    }

    for (const el of root.querySelectorAll("[style*='background']")) {
      const style = el.getAttribute("style") || "";
      const m = style.match(/url\(["']?(https:\/\/[^"')]+)/);
      if (m) add(m[1], 400, 400);
    }

    const html = root.innerHTML || "";
    const urlRe = /https:\/\/[^"'\\\s<>]+(?:scontent|fbcdn\.net)[^"'\\\s<>]*/g;
    let um;
    while ((um = urlRe.exec(html)) !== null) {
      add(um[0], 0, 0);
    }

    ranked.sort((a, b) => b.w * b.h - a.w * a.h);
    const seen = new Set();
    const out = [];
    for (const im of ranked) {
      const k = imageKey(im.src);
      if (seen.has(k)) continue;
      seen.add(k);
      out.push(im.src);
      if (out.length >= max) break;
    }
    return out;
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

  function looksLikeListing(text) {
    if (!text || text.length < 40) return false;
    if (/^(Intro|Group posts|Recent photos|Number of unread)/i.test(text)) return false;
    if (/Member of .+ since /i.test(text) && text.length < 200) return false;
    return /(cho thuê|for rent|bedroom|phòng ngủ|căn hộ|apartment|villa|nhà|giá|triệu|million|\$\d|studio|thuê|kiệt|full (nội thất|furniture)|pn\b)/i.test(
      text
    );
  }

  function cleanPostText(text) {
    return text
      .replace(/Facebook(\s+Facebook)+/g, " ")
      .replace(/Comment as [^\s]+/gi, " ")
      .replace(/See (translation|original)/gi, " ")
      .replace(/Rate this translation/gi, " ")
      .replace(/See more/gi, " ")
      .replace(/All reactions:?/gi, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function findContainerForSnippet(snippet) {
    const needle = snippet.slice(0, 48);
    if (needle.length < 12) return null;
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    while (walker.nextNode()) {
      const v = walker.currentNode.nodeValue || "";
      if (!v.includes(needle.slice(0, 24))) continue;
      let el = walker.currentNode.parentElement;
      let best = null;
      for (let i = 0; i < 20 && el; i++) {
        const block = (el.innerText || "").replace(/\s+/g, " ").trim();
        const imgs = collectImages(el, maxImages);
        const postedCount = (block.match(/\sposted to\s/gi) || []).length;
        if (
          block.length >= 40 &&
          block.length <= 3500 &&
          postedCount <= 1 &&
          (imgs.length >= 1 || looksLikeListing(block))
        ) {
          best = el;
          if (imgs.length >= 2 && postedCount <= 1) break;
        }
        el = el.parentElement;
      }
      if (best) return best;
    }
    return null;
  }

  const posts = [];
  const seenText = new Set();

  function pushPost(rawText, root) {
    if (posts.length >= limit) return false;
    let text = cleanPostText(rawText);
    if (!looksLikeListing(text)) return false;
    let body = text;
    const marker = body.match(/posted to .+?(?:·|:)\s*(.+)$/i);
    if (marker) body = marker[1].trim();
    body = body.replace(
      /^.*?((?:NCC\s*[-–—:]?\s*)?(?:CHO THUÊ|Cho thuê|House for rent|For rent|Bedroom|\d+-Bedroom|Căn hộ).+)$/i,
      "$1"
    );
    if (body.length < 30) body = text;
    body = body.replace(/\s*\+\d+\s*$/, "").trim();
    const key = body.slice(0, 100);
    if (seenText.has(key)) return false;
    seenText.add(key);

    let images = collectImages(root, maxImages);
    let permalink = findPermalink(root);
    if ((!images.length || !permalink) && !root) {
      const found = findContainerForSnippet(body);
      if (found) {
        if (!images.length) images = collectImages(found, maxImages);
        if (!permalink) permalink = findPermalink(found);
        root = found;
      }
    }

    posts.push({
      text: body.slice(0, 4000),
      images,
      permalink,
      postId: postIdFromUrl(permalink),
    });
    return true;
  }

  const pageText = (document.body.innerText || "").replace(/\s+/g, " ");
  const splitRe =
    /([A-Za-zÀ-ỹ][A-Za-zÀ-ỹ'’.\- ]{1,60}?)\s+posted to\s+(.+?)(?=(?:[A-Za-zÀ-ỹ][A-Za-zÀ-ỹ'’.\- ]{1,60}?\s+posted to\s+)|$)/gi;
  let m;
  const chunks = [];
  while ((m = splitRe.exec(pageText)) !== null) {
    chunks.push(m[0]);
  }
  for (const chunk of chunks) {
    if (posts.length >= limit) break;
    pushPost(chunk, findContainerForSnippet(chunk.replace(/\s+/g, " ").slice(40, 120)));
  }

  if (posts.length < limit) {
    for (const article of document.querySelectorAll('[role="article"]')) {
      if (posts.length >= limit) break;
      const text = (article.innerText || "").replace(/\s+/g, " ").trim();
      if ((text.match(/\sposted to\s/gi) || []).length > 1) continue;
      pushPost(text, article);
    }
  }

  if (posts.length < limit) {
    const needles = [
      "CHO THUÊ",
      "Cho thuê",
      "for rent",
      "For rent",
      "House for rent",
      "Bedroom",
      "phòng ngủ",
      "triệu",
      "Giá thuê",
      "Apartment",
      "Căn hộ",
      "NCC",
      "kiệt",
      "full nội thất",
      "Full furniture",
    ];
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    while (walker.nextNode() && posts.length < limit) {
      const t = walker.currentNode.nodeValue || "";
      if (!needles.some((k) => t.includes(k))) continue;
      let el = walker.currentNode.parentElement;
      let best = null;
      for (let i = 0; i < 18 && el; i++) {
        const block = (el.innerText || "").replace(/\s+/g, " ").trim();
        const postedCount = (block.match(/\sposted to\s/gi) || []).length;
        const imgs = collectImages(el, maxImages);
        if (
          imgs.length >= 1 &&
          block.length >= 50 &&
          block.length <= 3500 &&
          postedCount <= 1 &&
          looksLikeListing(block)
        ) {
          best = el;
          break;
        }
        el = el.parentElement;
      }
      if (!best) continue;
      pushPost(best.innerText, best);
    }
  }

  return JSON.stringify({
    scrapedAt: new Date().toISOString(),
    pageUrl: href,
    company: {
      name: name.slice(0, 500),
      facebookId: ids.facebookId,
      groupId: ids.groupId,
      pageUrl: href,
      logoUrl,
    },
    posts,
  });
})();
