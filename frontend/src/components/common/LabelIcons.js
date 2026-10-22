import { useEffect } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import {
  User,
  Phone,
  Mail,
  Calendar,
  Car,
  IndianRupee,
  MapPin,
  FileText,
  Hash,
} from "lucide-react";

// First matching pattern wins; labels with no match get no icon.
const RULES = [
  [/phone|mobile|contact|whatsapp/i, Phone],
  [/e-?mail/i, Mail],
  [/date|expiry|valid|month/i, Calendar],
  [
    /amount|price|rate|total|payment|advance|balance|gst|tax|charge|cost/i,
    IndianRupee,
  ],
  [/address|city|state|pin ?code|location|district/i, MapPin],
  [
    /reg|vehicle|bike|model|brand|make|chassis|engine|colou?r|km|odometer/i,
    Car,
  ],
  [/aadhaar|pan|number|no\.?$|id\b/i, Hash],
  [/name|person|owner|buyer|seller|customer|staff|recipient/i, User],
  [/note|remark|message|subject|description|to$/i, FileText],
];

const iconFor = (text) => {
  const hit = RULES.find(([re]) => re.test(text));
  return hit ? hit[1] : null;
};

// Labels are recomputed on every pass: React reuses label nodes, so an icon
// decided once can end up on the wrong text or duplicate the form's own icon.
const decorate = (root) => {
  root.querySelectorAll("label").forEach((label) => {
    const mine = label.querySelector(":scope > [data-label-icon]");
    const own = [...label.querySelectorAll("svg,img")].some(
      (node) => !node.closest("[data-label-icon]"),
    );
    const skip =
      own || label.querySelector('input[type="radio"],input[type="checkbox"]');
    const text = (mine ? label.textContent : label.textContent).trim();
    const Icon = skip ? null : iconFor(text);
    if (!Icon) {
      mine?.remove();
      return;
    }
    if (mine) return;
    const span = document.createElement("span");
    span.dataset.labelIcon = "1";
    span.setAttribute("aria-hidden", "true");
    span.style.cssText =
      "display:inline-flex;vertical-align:middle;margin-right:6px;color:#088395";
    span.innerHTML = renderToStaticMarkup(<Icon size={15} />);
    label.prepend(span);
  });
};

const LabelIcons = () => {
  useEffect(() => {
    let frame = 0;
    const schedule = () => {
      if (!frame) {
        frame = requestAnimationFrame(() => {
          frame = 0;
          decorate(document.body);
        });
      }
    };
    decorate(document.body);
    const observer = new MutationObserver(schedule);
    observer.observe(document.body, { childList: true, subtree: true });
    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
    };
  }, []);
  return null;
};

export default LabelIcons;
