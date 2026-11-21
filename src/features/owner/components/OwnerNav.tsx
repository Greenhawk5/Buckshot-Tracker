import React, { useRef, useEffect, useCallback } from 'react';
import { OwnerTab } from '../OwnerLayout';

export interface TabItem {
  id: OwnerTab;
  label: string;
  icon: string;
}

export const OWNER_TABS: TabItem[] = [
  { id: 'overview', label: 'Overview', icon: '📊' },
  { id: 'analytics', label: 'Analytics', icon: '📈' },
  { id: 'users', label: 'Users', icon: '👥' },
  { id: 'broadcasts', label: 'Broadcasts', icon: '📢' },
  { id: 'health', label: 'System Health', icon: '🩺' },
  { id: 'settings', label: 'Settings', icon: '⚙️' },
  { id: 'audit', label: 'Audit Logs', icon: '🛡️' },
  { id: 'feedback', label: 'Feedback', icon: '💬' },
  { id: 'exports', label: 'Reports Export', icon: '📁' },
];

interface OwnerNavProps {
  activeTab: OwnerTab;
  onSelectTab: (tab: OwnerTab) => void;
}

export const OwnerNav: React.FC<OwnerNavProps> = ({ activeTab, onSelectTab }) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const isPointerDownRef = useRef(false);
  const startXRef = useRef(0);
  const startYRef = useRef(0);
  const isDraggingRef = useRef(false);
  const isAdjustingScrollRef = useRef(false);
  const isProgrammaticScrollingRef = useRef(false);
  const programmaticTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Triple set for seamless infinite/circular wrap (Set 0, Set 1, Set 2)
  const repeatedSets = [0, 1, 2];

  // Helper to normalize scroll position back to middle set (Set 1) invisibly
  const normalizeScrollPosition = useCallback(() => {
    if (!scrollRef.current || isProgrammaticScrollingRef.current) return;
    const el = scrollRef.current;
    const totalWidth = el.scrollWidth;
    const setWidth = totalWidth / 3;
    if (setWidth <= 0) return;

    if (el.scrollLeft < setWidth * 0.4) {
      isAdjustingScrollRef.current = true;
      el.scrollLeft += setWidth;
      requestAnimationFrame(() => {
        isAdjustingScrollRef.current = false;
      });
    } else if (el.scrollLeft > setWidth * 1.6) {
      isAdjustingScrollRef.current = true;
      el.scrollLeft -= setWidth;
      requestAnimationFrame(() => {
        isAdjustingScrollRef.current = false;
      });
    }
  }, []);

  // Helper to scroll active tab into view using MINIMAL distance across all 3 sets
  const scrollToActive = useCallback(
    (smooth = true, preferredElement?: HTMLElement) => {
      if (!scrollRef.current) return;
      const container = scrollRef.current;
      const containerWidth = container.offsetWidth;
      const currentScrollLeft = container.scrollLeft;

      let targetLeft: number | null = null;

      if (preferredElement) {
        // Direct click on a specific element: center that exact element
        targetLeft =
          preferredElement.offsetLeft - (containerWidth - preferredElement.offsetWidth) / 2;
      } else {
        // Query all 3 instances of activeTab
        const matchingEls = Array.from(
          container.querySelectorAll<HTMLElement>(`[data-tab-id="${activeTab}"]`)
        );

        if (matchingEls.length === 0) return;

        // Choose the element with the minimal scroll distance from current position
        let minDistance = Infinity;
        for (const el of matchingEls) {
          const candTarget = el.offsetLeft - (containerWidth - el.offsetWidth) / 2;
          const dist = Math.abs(candTarget - currentScrollLeft);
          if (dist < minDistance) {
            minDistance = dist;
            targetLeft = candTarget;
          }
        }
      }

      if (targetLeft === null) return;

      // Mark programmatic scroll active to prevent mid-animation boundary wrap interference
      isProgrammaticScrollingRef.current = true;
      if (programmaticTimerRef.current) {
        clearTimeout(programmaticTimerRef.current);
      }

      container.scrollTo({
        left: targetLeft,
        behavior: smooth ? 'smooth' : 'auto',
      });

      // Clear programmatic flag after scroll settles, then silently normalize if needed
      programmaticTimerRef.current = setTimeout(() => {
        isProgrammaticScrollingRef.current = false;
        normalizeScrollPosition();
      }, smooth ? 280 : 50);
    },
    [activeTab, normalizeScrollPosition]
  );

  // Initial center on middle set on mount
  useEffect(() => {
    if (!scrollRef.current) return;
    const container = scrollRef.current;
    const activeEl = container.querySelector(
      `[data-nav-set="1"][data-tab-id="${activeTab}"]`
    ) as HTMLElement | null;

    if (activeEl) {
      const containerWidth = container.offsetWidth;
      const targetLeft =
        activeEl.offsetLeft - (containerWidth - activeEl.offsetWidth) / 2;
      container.scrollTo({ left: targetLeft, behavior: 'auto' });
    }
  }, []);

  // When activeTab changes from outside, scroll to the nearest instance
  useEffect(() => {
    scrollToActive(true);
  }, [activeTab, scrollToActive]);

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (programmaticTimerRef.current) {
        clearTimeout(programmaticTimerRef.current);
      }
    };
  }, []);

  // Handle circular scroll boundaries during manual user scrolling
  const handleScroll = () => {
    if (isProgrammaticScrollingRef.current || isAdjustingScrollRef.current) {
      return;
    }
    normalizeScrollPosition();
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    isPointerDownRef.current = true;
    startXRef.current = e.clientX;
    startYRef.current = e.clientY;
    isDraggingRef.current = false;
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isPointerDownRef.current) return;
    const deltaX = Math.abs(e.clientX - startXRef.current);
    const deltaY = Math.abs(e.clientY - startYRef.current);
    if (deltaX > 9 || deltaY > 9) {
      isDraggingRef.current = true;
    }
  };

  const handlePointerUp = () => {
    isPointerDownRef.current = false;
    setTimeout(() => {
      isDraggingRef.current = false;
    }, 50);
  };

  const handleTabClick = (tabId: OwnerTab, event: React.MouseEvent<HTMLButtonElement>) => {
    if (isDraggingRef.current) return;
    if (tabId === activeTab) return;

    window.Telegram?.WebApp?.HapticFeedback?.selectionChanged();

    // Scroll to the exact clicked element immediately
    const clickedBtn = event.currentTarget;
    scrollToActive(true, clickedBtn);

    onSelectTab(tabId);
  };

  return (
    <nav
      className="owner-nav-tabs"
      aria-label="Command Center navigation"
      role="navigation"
    >
      <div
        className="nav-tabs-scroll"
        ref={scrollRef}
        onScroll={handleScroll}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        {repeatedSets.map((setIdx) =>
          OWNER_TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={`${setIdx}-${tab.id}`}
                data-nav-set={setIdx}
                data-tab-id={tab.id}
                type="button"
                className={`nav-tab-btn ${isActive ? 'active' : ''}`}
                onClick={(e) => handleTabClick(tab.id, e)}
                aria-selected={isActive}
                role="tab"
              >
                <span className="nav-tab-icon" aria-hidden="true">
                  {tab.icon}
                </span>
                <span className="nav-tab-label">{tab.label}</span>
                {isActive && <span className="nav-tab-indicator" />}
              </button>
            );
          })
        )}
      </div>
    </nav>
  );
};
