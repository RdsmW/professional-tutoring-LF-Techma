# Academic Year Tutoring — Work Report

## Delivered

- Separated the public flow into visible Plan, Agreement, Review, Payment, and Confirmation stages.
- Removed the family-facing primary-subject choice and added multi-subject plus required free-text `Other` support.
- Added shared Standard/Advanced classification. Mixed and unlisted subjects are stored for Staff review without automatic pricing.
- Kept direct slot selection only for one known subject; ambiguous matching uses Professional Tutoring’s scheduling path.
- Updated fixed schedules: Full Year uses 9.5 months with 10% discount, Semester uses 5 and 4.5 months with 5% discount, and Monthly has nine full payments plus a June half payment.
- Applied the 3.6% card service fee to card-collected installment records and the displayed first payment amount.
- Preserved the existing finite-installment, PaymentIntent/SetupIntent, webhook, and finalization architecture.
- Added resilient Stripe return handling with session-backed continuation state and passed invitation paths into Confirmation.
- Applied the explicit non-contractual Academic Year source content supplied after the initial implementation:
  - Standard and Advanced Hours/Rates labels now match the supplied amounts and formatting.
  - Plan labels include the supplied 2026–27 due dates, discounts, and Full Year / Semester duration details.
  - The two-hour-session and hourly-trial explanation, the PT-staff confirmation note, and the supplied acknowledgement/signature labels are visible in the public flow.
  - Mixed Standard + Advanced requests display both rate sections and the Advanced-subject explanation.
- Removed the prior unsourced cancellation and payment-terms summaries rather than presenting paraphrased contractual text as approved language.

## Explicit limitations recorded

- The attached source describes the complete policy, payment terms, and acknowledgements/release it expects, but does not include their actual body text. The required policy headings are visible, but missing approved text is explicitly identified instead of fabricated.
- Portal invitation URLs are generated; no durable outbound invitation-email queue exists, so Confirmation does not claim an email was sent.
- Existing integration tests need a published public-form version token in their test environment before they can exercise registration APIs.