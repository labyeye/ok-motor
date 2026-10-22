import { useEffect } from "react";

// Default limits for text-like inputs that declare none; an explicit
// maxLength attribute always wins.
const DEFAULT_MAX = { text: 100, email: 100, tel: 15, url: 200, textarea: 500 };
const TYPES = ["text", "email", "tel", "url"];

const labelTextFor = (el) => {
  const wrap = el.closest("div");
  const label =
    el.previousElementSibling?.tagName === "LABEL"
      ? el.previousElementSibling
      : wrap?.querySelector(":scope > label");
  return (label?.textContent || "").replace(/\(.*?\)|\*|[:|].*$/g, "").trim();
};

// React reuses DOM nodes when fields are added or removed, so everything is
// recomputed on each scan instead of being decided once per node.
const sync = (el) => {
  const kind = el.tagName === "TEXTAREA" ? "textarea" : el.type;
  const eligible =
    (kind === "textarea" || TYPES.includes(kind)) &&
    !el.closest("[data-no-counter]") &&
    !/search/i.test(el.placeholder || "");
  if (!eligible) return;

  const text = labelTextFor(el);
  if (!el.placeholder || el._autoPh) {
    el.placeholder = text ? `Enter ${text.toLowerCase()}` : "";
    el._autoPh = Boolean(text);
  }
  if (!(el.maxLength > 0) || el._autoMax) {
    el.maxLength = DEFAULT_MAX[kind];
    el._autoMax = true;
  }
  if (el.readOnly || el.disabled) return;

  let hint = el.nextElementSibling;
  if (!hint || hint.dataset.counter !== "1") {
    hint = document.createElement("small");
    hint.dataset.counter = "1";
    hint.style.cssText =
      "display:block;margin:-6px 0 8px;color:#94a3b8;font-size:11px;text-align:right";
    el.insertAdjacentElement("afterend", hint);
  }
  const label = `${el.value.length} / ${el.maxLength} characters`;
  // Only write on change: a write is a DOM mutation and re-triggers scan.
  if (hint.textContent !== label) hint.textContent = label;
};

const scan = () => {
  document.querySelectorAll("input,textarea").forEach(sync);
  // Drop counters that no longer follow a field (stale or duplicated).
  document.querySelectorAll('small[data-counter="1"]').forEach((hint) => {
    const prev = hint.previousElementSibling;
    const owner = prev && /^(INPUT|TEXTAREA)$/.test(prev.tagName);
    if (!owner || hint.nextElementSibling?.dataset?.counter === "1")
      hint.remove();
  });
};

const FieldEnhancer = () => {
  useEffect(() => {
    let frame = 0;
    const schedule = () => {
      if (!frame) {
        frame = requestAnimationFrame(() => {
          frame = 0;
          scan();
        });
      }
    };
    scan();
    const observer = new MutationObserver(schedule);
    observer.observe(document.body, { childList: true, subtree: true });
    document.addEventListener("input", schedule);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
      document.removeEventListener("input", schedule);
    };
  }, []);
  return null;
};

export default FieldEnhancer;
