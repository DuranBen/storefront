import { ContentGroupLayout } from "@/components/content-page";

export default function Layout({ children }: LayoutProps<"/about">) {
  return <ContentGroupLayout group="house">{children}</ContentGroupLayout>;
}
