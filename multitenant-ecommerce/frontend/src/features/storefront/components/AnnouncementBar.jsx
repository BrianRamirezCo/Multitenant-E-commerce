import { useTranslation } from "react-i18next";

/**
 * Announcement bar. A quiet, static full-width strip at the very top — no
 * marquee, no motion. Dark elegant strip (premium look).
 *
 * Shows a few short value props separated by dots. On small screens only the
 * first one shows (to avoid crowding).
 */
export default function AnnouncementBar() {
  const { t } = useTranslation();

  const messages = [
    t("announce.shipping"),
    t("announce.returns"),
    t("announce.secure"),
  ];

  return (
    <div className="bg-neutral-950 text-white/70">
      <div className="container flex h-9 items-center justify-center gap-3 text-xs font-medium tracking-wide">
        {messages.map((msg, i) => (
          <span
            key={i}
            className={i === 0 ? "" : "hidden items-center gap-3 sm:flex"}
          >
            {i !== 0 && <span className="opacity-40">•</span>}
            {msg}
          </span>
        ))}
      </div>
    </div>
  );
}
