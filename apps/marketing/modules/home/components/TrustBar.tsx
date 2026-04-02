import { useTranslations } from "next-intl";

const frameworks = [
  { name: "SIPOC", standard: "Six Sigma" },
  { name: "BPMN 2.0", standard: "OMG Standard" },
  { name: "FMEA", standard: "ISO 17359" },
  { name: "ISO 31000", standard: "Risk Management" },
] as const;

export function TrustBar() {
  const t = useTranslations("home.trustBar");

  return (
    <section id="trust" className="py-16 px-6">
      <div className="mx-auto max-w-4xl text-center">
        <div className="flex flex-wrap items-center justify-center gap-3">
          {frameworks.map((fw) => (
            <div
              key={fw.name}
              className="flex flex-col items-center rounded-full border border-white/10 bg-white/5 px-5 py-3"
            >
              <span className="text-sm font-semibold text-white/80">
                {fw.name}
              </span>
              <span className="mt-0.5 text-[11px] leading-tight text-white/40">
                {fw.standard}
              </span>
            </div>
          ))}
        </div>

        <p className="mt-6 text-sm text-white/40">{t("subtitle")}</p>
      </div>
    </section>
  );
}
