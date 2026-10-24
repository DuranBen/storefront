import { services } from "@/lib/catalog";

export function Services() {
  return (
    <section aria-labelledby="services-title" className="section-sm container-page">
      <h2 id="services-title" className="sr-only">
        Our services
      </h2>
      <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {services.map((service) => (
          <li
            key={service.title}
            className="hairline-t py-6 text-center sm:px-6 lg:border-t-0 lg:border-l lg:py-2 lg:first:border-l-0"
          >
            <h3 className="label-caps">{service.title}</h3>
            <p className="mt-2 text-body-sm text-muted">{service.body}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
