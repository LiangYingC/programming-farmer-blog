import { useState, useEffect, useMemo, useCallback } from 'react';
import throttle from '@lib/throttle';

const initScrollState = {
  lastPositionY: 0,
  nowPositionY: 0,
  movedY: 0,
  isHideNavBar: false,
  isShowHeaderBgColor: false,
};

const useNavScrollHandler = () => {
  const [scrollState, setScrollState] = useState(initScrollState);
  const {
    lastPositionY,
    nowPositionY,
    movedY,
    isHideNavBar,
    isShowHeaderBgColor,
  } = scrollState;

  const handleScroll = () => {
    const newNowPositionY = window.pageYOffset;
    setScrollState((prev) => {
      return {
        ...prev,
        lastPositionY: prev.nowPositionY,
        nowPositionY: newNowPositionY,
      };
    });
  };

  const calculateScrollHeight = useCallback(() => {
    const scrollHeight = nowPositionY - lastPositionY;
    setScrollState((prev) => {
      return {
        ...prev,
        movedY: scrollHeight,
      };
    });
  }, [lastPositionY, nowPositionY]);

  const handleIsScrollToWindowTop = useCallback(() => {
    if (nowPositionY <= 0) {
      setScrollState((prev) => {
        return {
          ...prev,
          isShowHeaderBgColor: false,
        };
      });
    } else {
      setScrollState((prev) => {
        return {
          ...prev,
          isShowHeaderBgColor: true,
        };
      });
    }
  }, [nowPositionY]);

  const handleNavBarHide = useCallback(() => {
    if (movedY > 15) {
      setScrollState((prev) => {
        return {
          ...prev,
          movedY: 0,
          isHideNavBar: true,
        };
      });
    } else if (movedY <= -15 || nowPositionY < 80) {
      setScrollState((prev) => {
        return {
          ...prev,
          movedY: 0,
          isHideNavBar: false,
        };
      });
    }
  }, [movedY, nowPositionY]);

  useEffect(() => {
    setScrollState((prev) => {
      return {
        ...prev,
        nowPositionY: window.pageYOffset,
      };
    });

    const handleScrollWithThrottle = throttle(handleScroll, 15);
    window.addEventListener('scroll', handleScrollWithThrottle);

    return () => {
      window.removeEventListener('scroll', handleScrollWithThrottle);
    };
  }, []);

  useEffect(() => {
    calculateScrollHeight();
    handleIsScrollToWindowTop();
  }, [calculateScrollHeight, handleIsScrollToWindowTop, nowPositionY]);

  useEffect(() => {
    handleNavBarHide();
  }, [handleNavBarHide, movedY]);

  const isHideNavBarMemorized = useMemo(() => isHideNavBar, [isHideNavBar]);
  const isShowHeaderBgColorMemorized = useMemo(
    () => isShowHeaderBgColor,
    [isShowHeaderBgColor]
  );

  return {
    isHideNavBar: isHideNavBarMemorized,
    isShowHeaderBgColor: isShowHeaderBgColorMemorized,
  };
};

export default useNavScrollHandler;
