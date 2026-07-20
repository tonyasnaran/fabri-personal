"use client";

export function ContactForm() {
  return (
    <form
      onSubmit={(event) => event.preventDefault()}
      aria-describedby="contact-form-note"
      className="fade-rise flex flex-col gap-5"
    >
      <div className="flex flex-col gap-2">
        <label htmlFor="name" className="text-sm font-medium text-[#17140F]">
          Name
        </label>
        <input
          id="name"
          name="name"
          type="text"
          autoComplete="name"
          className="rounded-lg border border-[#E4DDCB] bg-[#F7F4EC] px-4 py-2.5 text-sm text-[#17140F] transition-colors outline-none focus:border-[#17140F]"
        />
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="email" className="text-sm font-medium text-[#17140F]">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          className="rounded-lg border border-[#E4DDCB] bg-[#F7F4EC] px-4 py-2.5 text-sm text-[#17140F] transition-colors outline-none focus:border-[#17140F]"
        />
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="message" className="text-sm font-medium text-[#17140F]">
          Message
        </label>
        <textarea
          id="message"
          name="message"
          rows={4}
          className="rounded-lg border border-[#E4DDCB] bg-[#F7F4EC] px-4 py-2.5 text-sm text-[#17140F] transition-colors outline-none focus:border-[#17140F]"
        />
      </div>

      <button
        type="submit"
        disabled
        aria-disabled="true"
        className="w-fit cursor-not-allowed rounded-full border border-[#E4DDCB] px-6 py-3 text-sm font-medium text-[#6B6558]"
      >
        Not yet connected
      </button>

      <p id="contact-form-note" className="text-sm text-[#6B6558]">
        This form isn&apos;t wired up to send messages yet — please use the button above to book a
        call instead.
      </p>
    </form>
  );
}
