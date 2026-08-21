export type AcademicYearPaymentStatusCopy = {
  label: string;
  detail: string;
};

export function academicYearPaymentStatusCopy(status?: string): AcademicYearPaymentStatusCopy | null {
  switch (status) {
    case "paid":
      return {
        label: "Paid",
        detail: "Your first scheduled payment was completed successfully.",
      };
    case "pending":
      return {
        label: "Pending",
        detail: "Your card setup is complete. Future scheduled installments remain pending until their due dates.",
      };
    case "unpaid":
      return {
        label: "Unpaid",
        detail: "Your selected payment method still needs to be completed.",
      };
    case "pending_staff_review":
      return {
        label: "Staff review",
        detail: "Professional Tutoring will confirm pricing before payment is requested.",
      };
    default:
      return null;
  }
}