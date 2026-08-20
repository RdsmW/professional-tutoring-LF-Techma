---
name: Academic Year collections
description: The billing model chosen for fixed Full Year, Semester, and Monthly Academic Year tutoring plans.
---

Academic Year payment plans are finite fixed schedules: Full Year has one installment, Semester has two, and Monthly has ten. Persist each installment as an application payment record and collect eligible saved-card installments server-side with an idempotency key per installment. Do not model these plans as open-ended Stripe subscriptions.

**Why:** The existing pricing schedule fixes the exact number, amount, and due dates of payments. A subscription would introduce unnecessary lifecycle and price-catalog complexity while no plan is intended to renew indefinitely.

**How to apply:** Keep the initial public payment continuation limited to the first installment. Future automated collection must use the stored installment record, its saved-card consent, and monotonic webhook reconciliation.