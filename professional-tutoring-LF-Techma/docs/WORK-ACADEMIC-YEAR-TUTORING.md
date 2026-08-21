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
- Added the complete supplied Academic Year Tutoring Policy to the Plan stage in an expandable, on-page section.
- Added the complete supplied Payment Terms and Acknowledgements and Release text to the Plan and Agreement stages.
- Updated Standard and Advanced rate labels, payment-plan dates, the two-hour-session explanation, acknowledgement labels, signatures, and Review payment summary to match the source.
- Review now shows selected Test Prep interests, applicable rate sections, the amount due at the secure payment step, and future installments for priced requests.
- Explicitly flagged the source’s appointment-booking and card-authorization clauses where they conflict with the approved in-app scheduling and scheduled Stripe collection behavior.
- Hourly package selections now submit successfully as Staff-review/payment-deferred requests. They do not create a payment amount or Stripe continuation before Staff confirms pricing.
- New public registrations always create card-backed Stripe continuations. The server rejects legacy manual-payment and alternative-payment payloads so a caller cannot bypass card collection or the 3.6% card service fee.

## Approval items recorded

- Mixed Standard + Advanced requests remain Staff-review/payment-deferred because the source does not define a final combined billing formula.
- The source permits card charges without explicit authorization only for late payment or nonpayment, while the app supports scheduled Stripe installment collection after card setup. This requires Masdouk/client approval; the source clause remains visible and unchanged.
- The source routes appointment requests through the office by phone/email, while the app permits approved in-app scheduling. This requires Masdouk/client approval; the source clause remains visible and unchanged.
- Portal invitation URLs are generated; no durable outbound invitation-email queue exists, so Confirmation does not claim an email was sent.
- Existing integration tests need a published public-form version token in their test environment before they can exercise registration APIs.