'use client';

import React from 'react';
import Lenis from '@studio-freight/lenis';
import { ZoomParallax } from './ui/zoom-parallax';

export default function ParallaxSection() {
  React.useEffect(() => {
    const lenis = new Lenis();
    function raf(time: number) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);

    return () => {
      lenis.destroy();
    };
  }, []);

  const images = [
    { src: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1280&h=720&fit=crop&auto=format&q=80', alt: 'Architecture building perspective' },
    { src: 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=1280&h=720&fit=crop&auto=format&q=80', alt: 'City bridge traffic' },
    { src: 'https://images.unsplash.com/photo-1557683316-973673baf926?w=800&h=800&fit=crop&auto=format&q=80', alt: 'Foliage abstract' },
    { src: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1280&h=720&fit=crop&auto=format&q=80', alt: 'Mountain forest sunset' },
    { src: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&h=800&fit=crop&auto=format&q=80', alt: 'Abstract design pattern' },
    { src: 'https://images.unsplash.com/photo-1439066615861-d1af74d74000?w=1280&h=720&fit=crop&auto=format&q=80', alt: 'Ocean visual scale' },
    { src: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=1280&h=720&fit=crop&auto=format&q=80', alt: 'Sunlight rays through forest' },
  ];

  return (
    <div id="zoom-parallax-section" className="w-full bg-transparent">
      <ZoomParallax images={images} />
    </div>
  );
}
