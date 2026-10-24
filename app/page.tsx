import FrameScrubber from "@/components/FrameScrubber";
import FencingOptions from "@/components/FencingOptions";
import ShowcaseScrubber from "@/components/ShowcaseScrubber";
import BeforeAfterGlider from "@/components/BeforeAfterGlider";
import WhyChooseUs from "@/components/WhyChooseUs";
import Testimonials from "@/components/Testimonials";
import InquiryForm from "@/components/InquiryForm";
import FinalCta from "@/components/FinalCta";

export default function Home() {
  return (
    <main>
      {/* Scroll-driven hero: 192 scrubbed frames over a pinned 4000px track */}
      <FrameScrubber />

      {/* Fencing types & pricing — placed directly after the construction animation */}
      <FencingOptions />

      {/* Second scroll-driven sequence: modern residential fence installation */}
      <ShowcaseScrubber />

      {/* Before & After Image Glider: interactive drag-to-reveal transformation */}
      <BeforeAfterGlider />

      {/* Why Choose Us — trust & value, right after the transformation slider */}
      <WhyChooseUs />

      {/* Testimonials — trust signals, after the value proposition */}
      <Testimonials />

      {/* Fencing inquiry form — the destination of every "quote" CTA on the page */}
      <InquiryForm />

      {/* Final push: pick a fence type or head straight to the form */}
      <FinalCta />
    </main>
  );
}
