import { ContentGroupLayout } from "@/components/content-page";

export default function Layout({ children }: LayoutProps<"/legal">) {
  return <ContentGroupLayout group="legal">{children}</ContentGroupLayout>;
}
