import React, { useState, useEffect, useRef, useCallback } from 'react';

export interface InfiniteCarouselProps<T> {
  items: T[];
  renderItem: (item: T, index: number, isRealActive: boolean) => React.ReactNode;
  ariaLabel: string;
  autoplayInterval?: number;
  sectionId: string;
}

export function InfiniteCarousel<T>({
  items,
  renderItem,
  ariaLabel,
  autoplayInterval = 4500,
  sectionId,
}: InfiniteCarouselProps<T>) {
  const n = items.length;
  // Cloned slides: [Last, Slide 0, Slide 1, ..., Slide N-1, First] -> length N + 2
  // Real index 0 is at displayIndex = 1
  const [displayIndex, setDisplayIndex] = useState(1);
  const [transitionEnabled, setTransitionEnabled] = useState(true);
  const [isPaused, setIsPaused] = useState(false);

  const lastNavTimeRef = useRef(0);
  const isHoveredRef = useRef(false);
  const isTouchingRef = useRef(false);
  const resumeTimeoutRef = useRef<number | null>(null);

  const touchStartXRef = useRef<number | null>(null);
  const touchStartYRef = useRef<number | null>(null);
  const touchDeltaXRef = useRef<number>(0);
  const isSwipingRef = useRef<boolean>(false);
  const timerRef = useRef<number | null>(null);

  // Mathematical modulo: realIndex is GUARANTEED to be in [0, n - 1]
  const realIndex = ((displayIndex - 1) % n + n) % n;

  // Cloned items array
  const extendedItems = [items[n - 1], ...items, items[0]];

  const updatePausedState = useCallback(() => {
    setIsPaused(isHoveredRef.current || isTouchingRef.current);
  }, []);

  const goNext = useCallback(() => {
    const now = Date.now();
    if (now - lastNavTimeRef.current < 260) return;
    lastNavTimeRef.current = now;
    setTransitionEnabled(true);
    setDisplayIndex((prev) => prev + 1);
  }, []);

  const goPrev = useCallback(() => {
    const now = Date.now();
    if (now - lastNavTimeRef.current < 260) return;
    lastNavTimeRef.current = now;
    setTransitionEnabled(true);
    setDisplayIndex((prev) => prev - 1);
  }, []);

  const goToSlide = useCallback((targetRealIndex: number) => {
    lastNavTimeRef.current = Date.now();
    setTransitionEnabled(true);
    setDisplayIndex(targetRealIndex + 1);
  }, []);

  // Handle seamless repositioning when reaching boundary clone
  const handleTransitionEnd = useCallback(() => {
    if (displayIndex >= n + 1) {
      // Reached clone of first slide (moving forward) -> snap to real first slide
      setTransitionEnabled(false);
      setDisplayIndex(1);
    } else if (displayIndex <= 0) {
      // Reached clone of last slide (moving backward) -> snap to real last slide
      setTransitionEnabled(false);
      setDisplayIndex(n);
    }
  }, [displayIndex, n]);

  // Autoplay management
  useEffect(() => {
    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReducedMotion || isPaused || n <= 1) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    timerRef.current = window.setInterval(() => {
      goNext();
    }, autoplayInterval);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [autoplayInterval, goNext, isPaused, n]);

  // Pause when document is hidden
  useEffect(() => {
    const handleVisibility = () => {
      if (document.hidden) {
        setIsPaused(true);
      } else {
        updatePausedState();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [updatePausedState]);

  // Mouse hover handlers
  const handleMouseEnter = () => {
    if (resumeTimeoutRef.current) clearTimeout(resumeTimeoutRef.current);
    isHoveredRef.current = true;
    updatePausedState();
  };

  const handleMouseLeave = () => {
    isHoveredRef.current = false;
    updatePausedState();
  };

  // Touch gesture handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    if (resumeTimeoutRef.current) clearTimeout(resumeTimeoutRef.current);
    isTouchingRef.current = true;
    updatePausedState();

    touchStartXRef.current = e.touches[0].clientX;
    touchStartYRef.current = e.touches[0].clientY;
    touchDeltaXRef.current = 0;
    isSwipingRef.current = true;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isSwipingRef.current || touchStartXRef.current === null || touchStartYRef.current === null) {
      return;
    }
    const currentX = e.touches[0].clientX;
    const currentY = e.touches[0].clientY;
    const diffX = currentX - touchStartXRef.current;
    const diffY = currentY - touchStartYRef.current;

    touchDeltaXRef.current = diffX;

    if (Math.abs(diffX) > Math.abs(diffY) && e.cancelable) {
      e.preventDefault();
    }
  };

  const handleTouchEnd = () => {
    if (!isSwipingRef.current) return;
    const deltaX = touchDeltaXRef.current;
    isSwipingRef.current = false;
    touchStartXRef.current = null;
    touchStartYRef.current = null;
    touchDeltaXRef.current = 0;

    if (deltaX < -30) {
      window.Telegram?.WebApp?.HapticFeedback?.selectionChanged();
      goNext();
    } else if (deltaX > 30) {
      window.Telegram?.WebApp?.HapticFeedback?.selectionChanged();
      goPrev();
    }

    // Cooldown before unpausing touch
    if (resumeTimeoutRef.current) clearTimeout(resumeTimeoutRef.current);
    resumeTimeoutRef.current = window.setTimeout(() => {
      isTouchingRef.current = false;
      updatePausedState();
    }, 1200);
  };

  // Keyboard accessibility
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowRight') {
      goNext();
    } else if (e.key === 'ArrowLeft') {
      goPrev();
    }
  };

  return (
    <div
      className="carousel-container"
      role="region"
      aria-label={ariaLabel}
      aria-roledescription="carousel"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onKeyDown={handleKeyDown}
      tabIndex={0}
    >
      {/* Slider Viewport */}
      <div
        className="carousel-viewport"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div
          className="carousel-track"
          style={{
            transform: `translateX(-${displayIndex * 100}%)`,
            transition: transitionEnabled ? 'transform 0.35s cubic-bezier(0.25, 1, 0.5, 1)' : 'none',
          }}
          onTransitionEnd={handleTransitionEnd}
        >
          {extendedItems.map((item, idx) => {
            const itemRealIdx = idx === 0 ? n - 1 : idx === n + 1 ? 0 : idx - 1;
            const isCurrent = itemRealIdx === realIndex;
            return (
              <div
                key={`${sectionId}-slide-${idx}`}
                className={`carousel-slide ${isCurrent ? 'carousel-slide--active' : ''}`}
                role="group"
                aria-roledescription="slide"
                aria-label={`${itemRealIdx + 1} of ${n}`}
                aria-hidden={!isCurrent}
              >
                {renderItem(item, itemRealIdx, isCurrent)}
              </div>
            );
          })}
        </div>
      </div>

      {/* Tactical Carousel Navigation Toolbar */}
      <div className="carousel-toolbar">
        <button
          type="button"
          className="carousel-nav-btn carousel-nav-btn--prev"
          onClick={() => {
            window.Telegram?.WebApp?.HapticFeedback?.impactOccurred('light');
            goPrev();
          }}
          aria-label={`Previous slide in ${ariaLabel}`}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>

        <div className="carousel-pagination">
          <div className="carousel-dots" role="tablist" aria-label="Slide indicators">
            {items.map((_, idx) => (
              <button
                key={`${sectionId}-dot-${idx}`}
                type="button"
                role="tab"
                className={`carousel-dot ${idx === realIndex ? 'carousel-dot--active' : ''}`}
                onClick={() => {
                  window.Telegram?.WebApp?.HapticFeedback?.selectionChanged();
                  goToSlide(idx);
                }}
                aria-label={`Go to slide ${idx + 1}`}
                aria-selected={idx === realIndex}
              />
            ))}
          </div>
          <span className="carousel-counter" aria-live="polite">
            <span className="counter-current">{String(realIndex + 1).padStart(2, '0')}</span>
            <span className="counter-sep">/</span>
            <span className="counter-total">{String(n).padStart(2, '0')}</span>
          </span>
        </div>

        <button
          type="button"
          className="carousel-nav-btn carousel-nav-btn--next"
          onClick={() => {
            window.Telegram?.WebApp?.HapticFeedback?.impactOccurred('light');
            goNext();
          }}
          aria-label={`Next slide in ${ariaLabel}`}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>
      </div>
    </div>
  );
}
