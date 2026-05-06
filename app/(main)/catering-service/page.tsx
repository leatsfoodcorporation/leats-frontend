import CateringServiceForm from "@/components/Home/Enquiry/catering-service";
import { generatePageMetadata } from "@/lib/seo";

export async function generateMetadata() {
  return await generatePageMetadata({
    pagePath: "/catering-service",
    defaultTitle: "Catering Service - Professional Event Catering",
    defaultDescription: "Planning an event? Let us handle the catering! Get customized menus for weddings, corporate events, parties, and more.",
    defaultKeywords: "catering service, event catering, wedding catering, corporate catering, party catering",
  });
}

export default function CateringServicePage() {
  return <CateringServiceForm />;
}
