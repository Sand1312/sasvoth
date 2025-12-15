"use client";

import React, { useEffect, useRef } from "react";
import * as PIXI from "pixi.js";
import gsap from "gsap";

interface RainAnimationProps {
  obstacleSelector: string;
}

export default function RainAnimation({ obstacleSelector }: RainAnimationProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current || typeof window === "undefined") return;

    // --- CONFIGURATION ---
    const CONFIG = {
      dropCountPerFrame: 5,
      gravity: 20,
      color: 0xaaccff,
      splashColor: 0xffffff,
    };

    let app: PIXI.Application | null = null;
    let isMounted = true;

    const initApp = async () => {
      const _app = new PIXI.Application();
      await _app.init({
        width: window.innerWidth,
        height: window.innerHeight,
        backgroundAlpha: 0,
        antialias: true,
        resolution: window.devicePixelRatio || 1,
        autoDensity: true,
        resizeTo: window,
      });

      if (!isMounted) {
        _app.destroy({ removeView: true });
        return;
      }

      app = _app;
      if (containerRef.current) {
        containerRef.current.appendChild(app.canvas);
      }

      // Container for drops
      const rainContainer = new PIXI.Container();
      app.stage.addChild(rainContainer);

      // --- GENERATE TEXTURES ---
      const dropGraphics = new PIXI.Graphics();
      dropGraphics.rect(0, 0, 2, 15);
      dropGraphics.fill(CONFIG.color);
      const dropTexture = app.renderer.generateTexture(dropGraphics);

      const splashGraphics = new PIXI.Graphics();
      splashGraphics.circle(0, 0, 3);
      splashGraphics.fill({ color: CONFIG.splashColor, alpha: 0.6 });
      const splashTexture = app.renderer.generateTexture(splashGraphics);

      // --- OBSTACLE TRACKING ---
      let obstacleBounds = { left: 0, right: 0, top: 0, width: 0 };
      
      function updateObstacleBounds() {
        const obstacleEl = document.querySelector(obstacleSelector);
        if (obstacleEl) {
          const rect = obstacleEl.getBoundingClientRect();
          obstacleBounds = {
            left: rect.left,
            right: rect.right,
            top: rect.top,
            width: rect.width,
          };
        } else {
          obstacleBounds = { left: -100, right: -100, top: 0, width: 0 };
        }
      }
      
      updateObstacleBounds();
      window.addEventListener("resize", updateObstacleBounds);

      // --- SPAWN LOGIC ---
      function spawnDrop() {
        if (!app || !app.stage) return; // Safety check
        const drop = new PIXI.Sprite(dropTexture);
        
        const startX = Math.random() * app.screen.width;
        const startY = -50 - (Math.random() * 100);
        
        drop.x = startX;
        drop.y = startY;
        drop.alpha = 0.3 + Math.random() * 0.5;
        drop.scale.y = 0.8 + Math.random() * 0.5;

        rainContainer.addChild(drop);

        let endY = app.screen.height;
        let hitsObstacle = false;

        if (startX >= obstacleBounds.left && startX <= obstacleBounds.right) {
          if (obstacleBounds.top > startY) {
               endY = obstacleBounds.top;
               hitsObstacle = true;
          }
        }

        const distance = endY - startY;
        const speed = (1000 + Math.random() * 500);
        const duration = distance / speed;

        gsap.to(drop, {
          y: endY,
          duration: duration,
          ease: "none",
          onComplete: () => {
            // Check if app still exists before spawning splash or destroying
            if (!app || !app.renderer) return;
            spawnSplash(drop.x, endY, hitsObstacle);
            drop.destroy(); 
          }
        });
      }

      function spawnSplash(x: number, y: number, isObstacle: boolean) {
        const particleCount = isObstacle ? 5 : 2;
        
        for (let i = 0; i < particleCount; i++) {
          const splash = new PIXI.Sprite(splashTexture);
          splash.x = x;
          splash.y = y;
          splash.alpha = 0.8;
          
          rainContainer.addChild(splash);

          const angle = (Math.PI) + (Math.random() * Math.PI);
          const velocity = 10 + Math.random() * 20;
          const destX = x + Math.cos(angle) * velocity;
          const destY = y + Math.sin(angle) * velocity * 0.5;

          gsap.to(splash, {
            x: destX,
            y: destY,
            alpha: 0,
            scale: 0.1,
            duration: 0.2 + Math.random() * 0.2,
            onComplete: () => splash.destroy()
          });
        }
      }

      // --- TICKER ---
      app.ticker.add(() => {
        for (let i = 0; i < CONFIG.dropCountPerFrame; i++) {
          spawnDrop();
        }
      });
    };

    initApp();

    return () => {
      isMounted = false;
      window.removeEventListener("resize", () => {}); 
      if (app) {
        app.destroy({ removeView: true });
        app = null;
      }
    };
  }, [obstacleSelector]);

  return (
    <div 
      ref={containerRef} 
      style={{ 
        position: "fixed", 
        top: 0, 
        left: 0, 
        width: "100vw", 
        height: "100vh", 
        pointerEvents: "none", 
        zIndex: 50 // High z-index to be on top, but pointer-events none allows clicking through
      }} 
    />
  );
}
