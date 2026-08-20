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

## Explicit limitations recorded

- No approved, complete policy body or payment-method wording was available in the repository. The required policy headings are visible, but missing approved text is explicitly identified instead of fabricated.
- Portal invitation URLs are generated; no durable outbound invitation-email queue exists, so Confirmation does not claim an email was sent.
- Existing integration tests need a published public-form version token in their test environment before they can exercise registration APIs.