import { FeaturedCollections } from "@/components/home/collections";
import { EveningBanner } from "@/components/home/evening-banner";
import { Hero } from "@/components/home/hero";
import { LeatherGoods } from "@/components/home/leather-goods";
import { NewArrivals } from "@/components/home/new-arrivals";
import { Services } from "@/components/home/services";
import { TailoringEdit } from "@/components/home/tailoring-edit";

export default function Home() {
  return (
    <main className="flex-1">
      <Hero />
      <FeaturedCollections />
      <TailoringEdit />
      <NewArrivals />
      <EveningBanner />
      <LeatherGoods />
      <Services />
    </main>
  );
}
