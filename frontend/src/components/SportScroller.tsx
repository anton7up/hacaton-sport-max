import { useCallback, useEffect, useRef, useState } from "react";
import { sports } from "../utils/sports";

const SCROLL_STEP = 3 * (92 + 12);
const EDGE_TOLERANCE = 2;

export function SportScroller({
  selectedSport,
  onSelect,
}: {
  selectedSport: string;
  onSelect: (sport: string) => void;
}) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const dragStartX = useRef(0);
  const dragStartScroll = useRef(0);
  const dragged = useRef(false);
  const activePointerId = useRef<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);

  const updateEdges = useCallback(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;
    setAtStart(scroller.scrollLeft <= EDGE_TOLERANCE);
    setAtEnd(
      scroller.scrollLeft + scroller.clientWidth >=
        scroller.scrollWidth - EDGE_TOLERANCE,
    );
  }, []);

  useEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;
    updateEdges();
    const observer = new ResizeObserver(updateEdges);
    observer.observe(scroller);
    return () => observer.disconnect();
  }, [updateEdges]);

  const finishDrag = (pointerId: number) => {
    const scroller = scrollerRef.current;
    if (scroller?.hasPointerCapture(pointerId)) {
      scroller.releasePointerCapture(pointerId);
    }
    activePointerId.current = null;
    setIsDragging(false);
    updateEdges();
    if (dragged.current) {
      window.setTimeout(() => {
        dragged.current = false;
      }, 0);
    }
  };

  return (
    <div className="sport-scroller-shell">
      <button
        type="button"
        className="sport-scroll-arrow sport-scroll-arrow-left"
        aria-label="Показать предыдущие виды спорта"
        disabled={atStart}
        onClick={() =>
          scrollerRef.current?.scrollBy({
            left: -SCROLL_STEP,
            behavior: "smooth",
          })
        }
      >
        ‹
      </button>
      <div
        ref={scrollerRef}
        className={`sport-scroller${isDragging ? " is-dragging" : ""}`}
        onScroll={updateEdges}
        onWheel={(event) => {
          const scroller = event.currentTarget;
          const delta =
            Math.abs(event.deltaY) >= Math.abs(event.deltaX)
              ? event.deltaY
              : event.deltaX;
          const canMove =
            (delta < 0 && scroller.scrollLeft > EDGE_TOLERANCE) ||
            (delta > 0 &&
              scroller.scrollLeft + scroller.clientWidth <
                scroller.scrollWidth - EDGE_TOLERANCE);
          if (!canMove) return;
          event.preventDefault();
          scroller.scrollLeft += delta;
        }}
        onPointerDown={(event) => {
          if (event.pointerType !== "mouse" || event.button !== 0) return;
          dragged.current = false;
          activePointerId.current = event.pointerId;
          dragStartX.current = event.clientX;
          dragStartScroll.current = event.currentTarget.scrollLeft;
        }}
        onPointerMove={(event) => {
          if (
            event.pointerType !== "mouse" ||
            activePointerId.current !== event.pointerId
          )
            return;
          const distance = event.clientX - dragStartX.current;
          if (Math.abs(distance) > 5) {
            if (!event.currentTarget.hasPointerCapture(event.pointerId)) {
              event.currentTarget.setPointerCapture(event.pointerId);
            }
            dragged.current = true;
            setIsDragging(true);
          }
          if (!dragged.current) return;
          event.preventDefault();
          event.currentTarget.scrollLeft = dragStartScroll.current - distance;
        }}
        onPointerUp={(event) => finishDrag(event.pointerId)}
        onPointerCancel={(event) => finishDrag(event.pointerId)}
        onClickCapture={(event) => {
          if (!dragged.current) return;
          event.preventDefault();
          event.stopPropagation();
          dragged.current = false;
        }}
        onDragStart={(event) => event.preventDefault()}
      >
        <button
          className={!selectedSport ? "active" : ""}
          onClick={() => onSelect("")}
        >
          <span>✦</span>
          <small>Все</small>
        </button>
        {sports.slice(0, 8).map((sport) => (
          <button
            key={sport.id}
            className={selectedSport === sport.id ? "active" : ""}
            onClick={() => onSelect(sport.id)}
          >
            <span>{sport.emoji}</span>
            <small>{sport.name}</small>
          </button>
        ))}
      </div>
      <button
        type="button"
        className="sport-scroll-arrow sport-scroll-arrow-right"
        aria-label="Показать следующие виды спорта"
        disabled={atEnd}
        onClick={() =>
          scrollerRef.current?.scrollBy({
            left: SCROLL_STEP,
            behavior: "smooth",
          })
        }
      >
        ›
      </button>
    </div>
  );
}
