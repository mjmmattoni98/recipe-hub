import { useEffect, useRef, useState } from "react";

// How far below the viewport the next page starts loading, so it is usually
// ready before the reader reaches the end of the list.
const PRELOAD_MARGIN = "0px 0px 600px 0px";

/**
 * Calls `onLoadMore` when the returned ref's element scrolls near the
 * viewport. While `enabled` is false nothing is observed, so pass
 * `hasNextPage && !isFetchingNextPage` to avoid duplicate requests.
 *
 * The observer is recreated every time `enabled` turns back on, and a new
 * observer reports straight away. A page that still leaves the sentinel on
 * screen (tall screens, few results) therefore keeps loading until it is
 * pushed out of view or there is nothing left.
 */
export function useLoadMoreOnScroll({
  enabled,
  onLoadMore,
}: {
  enabled: boolean;
  onLoadMore: () => void;
}) {
  const [sentinel, setSentinel] = useState<Element | null>(null);
  const onLoadMoreRef = useRef(onLoadMore);

  useEffect(() => {
    onLoadMoreRef.current = onLoadMore;
  }, [onLoadMore]);

  useEffect(() => {
    if (!enabled || !sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          onLoadMoreRef.current();
        }
      },
      { rootMargin: PRELOAD_MARGIN },
    );
    observer.observe(sentinel);

    return () => observer.disconnect();
  }, [enabled, sentinel]);

  return setSentinel;
}
