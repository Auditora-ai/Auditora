"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";

const faqs = [
  {
    question: "How does the free scan work?",
    answer:
      "Paste any company URL and Auditora's AI analyzes the organization in 60 seconds. It generates a preview SIPOC map and risk overview — no signup required. Sign up for the full diagnostic with BPMN diagrams, FMEA analysis, and actionable recommendations.",
  },
  {
    question: "How accurate are the AI-generated process maps?",
    answer:
      "Our AI combines web analysis with structured SIPOC methodology to achieve high-accuracy process discovery. All generated maps are editable, so you can refine and validate with your team. The AI provides confidence scores for each process element.",
  },
  {
    question: "Is my data secure?",
    answer:
      "Absolutely. All data is encrypted at rest and in transit. We follow SOC 2 practices and are working toward certification. Your process data is never shared or used to train models. Enterprise plans include additional security controls.",
  },
  {
    question: "Can I export BPMN diagrams?",
    answer:
      "Yes. All BPMN 2.0 diagrams are exportable in standard .bpmn format, compatible with tools like Camunda, Bizagi, and Signavio. You can also export as PNG, SVG, and PDF for presentations and documentation.",
  },
  {
    question: "How do decision simulations work?",
    answer:
      "Auditora generates Harvard-style decision scenarios based on your real processes. Team members face realistic situations and choose responses. The system scores alignment with documented procedures, revealing knowledge gaps and training needs.",
  },
  {
    question: "What standards do you support?",
    answer:
      "We're built on SIPOC (Six Sigma), BPMN 2.0 (OMG Standard), FMEA (ISO 17359), and ISO 31000 (Risk Management). Our methodology is designed for compliance-ready documentation that auditors love.",
  },
  {
    question: "How is this different from ChatGPT?",
    answer:
      "ChatGPT is a general-purpose assistant. Auditora is a specialized process intelligence platform with structured methodologies, standards compliance, interactive diagrams, risk scoring, and team evaluation tools. We don't just generate text — we build living process maps.",
  },
];

export function Faq() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggle = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section className="py-24 lg:py-32">
      <div className="max-w-3xl mx-auto px-6">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5 }}
          className="text-center text-white font-display text-3xl lg:text-4xl font-bold mb-16"
        >
          Frequently asked questions
        </motion.h2>

        <div className="flex flex-col gap-3">
          {faqs.map((faq, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.4, delay: index * 0.08 }}
            >
              <button
                onClick={() => toggle(index)}
                className="w-full text-left bg-white/5 border border-white/10 rounded-2xl px-6 py-5 flex items-center justify-between gap-4 cursor-pointer hover:bg-white/[0.07] transition-colors"
              >
                <span className="text-white font-medium">{faq.question}</span>
                <ChevronDown
                  className={`shrink-0 text-white/60 transition-transform duration-300 ${
                    openIndex === index ? "rotate-180" : ""
                  }`}
                  size={20}
                />
              </button>

              <AnimatePresence initial={false}>
                {openIndex === index && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: "easeInOut" as const }}
                    className="overflow-hidden"
                  >
                    <div className="px-6 pb-5 pt-3">
                      <p className="text-white/60 text-sm leading-relaxed">
                        {faq.answer}
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
