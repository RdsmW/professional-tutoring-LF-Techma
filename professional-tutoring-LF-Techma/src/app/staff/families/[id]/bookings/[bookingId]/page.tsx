import { StaffBookingDetailClient } from "@/components/staff-booking-detail-client";

export default async function StaffFamilyBookingPage({
  params,
}: {
  params: Promise<{ id: string; bookingId: string }>;
}) {
  const { id, bookingId } = await params;
  return <StaffBookingDetailClient familyId={id} bookingId={bookingId} />;
}
