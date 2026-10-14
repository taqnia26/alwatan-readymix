import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import HTMLFlipBook from 'react-pageflip';

export interface Engine {
  flip: (index: number) => void;
  flipNext: () => void;
  flipPrev: () => void;
  getOrientation: () => string;
  off: (event: string) => void;
  destroy: () => void;
}

// react-pageflip does not dispose its engine on unmount. Own its lifecycle so a
// resized/zoomed book cannot keep animating and update the new book's counter.
const ProfileFlipBook = forwardRef<{ pageFlip: () => Engine }, Record<string, unknown>>(
  function ProfileFlipBook(props, ref) {
    const engine = useRef<Engine | null>(null);
    useImperativeHandle(ref, () => ({ pageFlip: () => engine.current! }), []);
    useEffect(() => () => {
      if (!engine.current) return;
      for (const event of ['flip', 'changeState', 'changeOrientation', 'init', 'update']) engine.current.off(event);
      engine.current.destroy();
      engine.current = null;
    }, []);
    const Book = HTMLFlipBook as unknown as React.ComponentType<Record<string, unknown>>;
    // The extra host owns the engine's DOM: destroy() may remove its inner host
    // without removing the outer host that React itself must unmount.
    return <div style={{ display: 'contents' }}>
      <Book {...props} renderOnlyPageLengthChange
        onInit={(event: { object: Engine }) => { engine.current = event.object; }} />
    </div>;
  },
);

export default ProfileFlipBook;
