import Form from "next/form";
import { MAX_SEARCH_LENGTH } from "@/lib/catalog";
import { SearchIcon } from "./icons";

/** GET form to /search; Next's <Form> turns submits into client-side navigations. */
export function SearchForm({
  defaultValue,
  autoFocus,
}: {
  defaultValue?: string;
  autoFocus?: boolean;
}) {
  return (
    <Form action="/search" role="search" className="relative mx-auto mt-8 max-w-md">
      <label htmlFor="search-query" className="sr-only">
        Search products
      </label>
      <input
        id="search-query"
        name="q"
        type="search"
        defaultValue={defaultValue}
        autoFocus={autoFocus}
        maxLength={MAX_SEARCH_LENGTH}
        autoComplete="off"
        enterKeyHint="search"
        placeholder="Coats, bags, jewellery…"
        className="field pr-12"
      />
      <button
        type="submit"
        aria-label="Search"
        className="btn-icon absolute inset-y-0 right-0 my-auto mr-0.5"
      >
        <SearchIcon />
      </button>
    </Form>
  );
}
