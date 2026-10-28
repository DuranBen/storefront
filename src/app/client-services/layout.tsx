import { ContentGroupLayout } from "@/components/content-page";

export default function Layout({ children }: LayoutProps<"/client-services">) {
  return <ContentGroupLayout group="services">{children}</ContentGroupLayout>;
}
