import { mailtoHref, whatsappHref } from "@/lib/contact-links";

function MailIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m3 7 9 6 9-6" />
    </svg>
  );
}

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2zm0 1.8c2.17 0 4.21.85 5.75 2.38a8.09 8.09 0 0 1 2.37 5.73c0 4.48-3.64 8.12-8.12 8.12-1.42 0-2.8-.37-4.01-1.07l-.29-.17-3.12.82.83-3.04-.18-.3a8.1 8.1 0 0 1-1.23-4.36c0-4.48 3.64-8.11 8.1-8.11zm4.57 10.48c-.22-.11-1.32-.65-1.52-.72-.2-.08-.35-.11-.5.11-.15.22-.58.72-.71.87-.13.15-.26.16-.48.05-.22-.11-.93-.34-1.77-1.09-.66-.58-1.1-1.3-1.23-1.52-.13-.22-.01-.34.1-.45.1-.1.22-.26.33-.39.11-.13.15-.22.22-.37.07-.15.04-.28-.02-.39-.06-.11-.5-1.2-.68-1.65-.18-.43-.36-.37-.5-.38h-.43c-.15 0-.39.06-.59.28-.2.22-.78.76-.78 1.86s.8 2.16.91 2.31c.11.15 1.57 2.4 3.8 3.36 2.24.97 2.24.65 2.64.61.4-.04 1.32-.54 1.51-1.06.19-.52.19-.97.13-1.06-.06-.09-.2-.15-.42-.26z" />
    </svg>
  );
}

const actionClass =
  "inline-flex h-9 w-9 items-center justify-center rounded-quieter border border-line bg-white text-charcoal transition hover:border-ocean/40 hover:text-ocean focus:outline-none focus:ring-2 focus:ring-ocean/20";

type ContactActionsProps = {
  whatsapp?: string | null;
  email?: string | null;
  message: string;
  emailSubject?: string;
  className?: string;
};

export function ContactActions({
  whatsapp,
  email,
  message,
  emailSubject,
  className = "",
}: ContactActionsProps) {
  const wa = whatsapp ? whatsappHref(whatsapp, message) : null;
  const mail = email?.trim()
    ? mailtoHref(email.trim(), emailSubject, message)
    : null;

  if (!wa && !mail) return null;

  return (
    <div className={`flex items-center gap-2 ${className}`.trim()}>
      {wa ? (
        <a
          href={wa}
          target="_blank"
          rel="noopener noreferrer"
          className={actionClass}
          title="Open WhatsApp with prefilled message"
          aria-label="WhatsApp with prefilled message"
        >
          <WhatsAppIcon className="h-4 w-4" />
        </a>
      ) : null}
      {mail ? (
        <a
          href={mail}
          className={actionClass}
          title="Open email with prefilled message"
          aria-label="Email with prefilled message"
        >
          <MailIcon className="h-4 w-4" />
        </a>
      ) : null}
    </div>
  );
}
