import AdminApp from "../AdminApp";
import { getAdminSectionKeyFromSegment } from "../navConfig";

type AdminSectionPageProps = {
  params: {
    section: string;
  };
};

export default function AdminSectionPage({ params }: AdminSectionPageProps) {
  const sectionKey = getAdminSectionKeyFromSegment(params.section);
  return <AdminApp initialSection={sectionKey} />;
}
