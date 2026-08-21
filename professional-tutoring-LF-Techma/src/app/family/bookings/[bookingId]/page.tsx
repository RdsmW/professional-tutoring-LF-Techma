import { FamilyBookingDetailClient } from "@/components/family-booking-detail-client";

export default async function FamilyBookingPage({
  params,
}: {
  params: Promise<{ bookingId: string }>;
}) {
  const { bookingId } = await params;
  return <FamilyBookingDetailClient bookingId={bookingId} />;
}
