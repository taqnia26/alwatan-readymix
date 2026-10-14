import React from 'react';
import { createRoot } from 'react-dom/client';
import VideoPlayer from '../src/components/VideoPlayer';

const src = new URLSearchParams(location.search).get('src')!;
// Retain the native error if React replaces an unsupported video with its alert.
document.addEventListener('error', event => {
  if (event.target instanceof HTMLVideoElement) {
    (window as Window & { failedVideo?: HTMLVideoElement }).failedVideo = event.target;
  }
}, true);
createRoot(document.getElementById('root')!).render(<VideoPlayer src={src} muted />);
