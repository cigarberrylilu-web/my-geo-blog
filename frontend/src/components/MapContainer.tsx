import { useEffect, useRef, useState, useImperativeHandle, forwardRef } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Location } from '@/src/types';
import { GalleryModal } from './GalleryModal';

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN || (process.env as any).VITE_MAPBOX_ACCESS_TOKEN;

interface MapContainerProps {
  isAdmin?: boolean;
  onMapClick?: (lngLat: { lng: number; lat: number }) => void;
}

export interface MapRef {
  flyTo: (coords: [number, number], zoom?: number) => void;
  refresh: () => void;
}

/**
 * 生成 Cloudflare Image Resizing 缩略图 URL
 *
 * 格式：/cdn-cgi/image/<options>/<完整原始URL>
 *
 * 规则：
 * - 缩略图（弹窗预览）：width=400, quality=75, format=auto
 * - 原图（GalleryModal）：直接使用原始 URL，不经过任何转换
 *
 * 注意：
 * 1. Cloudflare Image Resizing 需要你的站点域名走 CF 代理（橙云）
 * 2. 本地开发环境 /cdn-cgi/image/ 路径不生效，会直接 404，
 *    开发时建议临时用原图（代码中已用 DEV 判断跳过转换）
 * 3. 图片源（R2 自定义域）需要在 CF 后台 Speed > Optimization >
 *    Image Resizing 中加入白名单，或与网站同一账号下
 */
function cfThumb(originalUrl: string, width = 400, quality = 75): string {
  if (!originalUrl) return '';

  // 本地开发直接返回原图，避免 /cdn-cgi/image/ 404
  if (import.meta.env.DEV) return originalUrl;

  const options = `width=${width},quality=${quality},format=auto`;
  // 无论同域还是跨域（R2 自定义域），统一把完整 URL 放在 options 后面
  // CF 会自动处理跨域抓取（需要在 CF 后台允许该源域）
  return `/cdn-cgi/image/${options}/${originalUrl}`;
}

export const MapContainer = forwardRef<MapRef, MapContainerProps>(({ isAdmin, onMapClick }, ref) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markers = useRef<mapboxgl.Marker[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [galleryImages, setGalleryImages] = useState<string[] | null>(null);

  const isAdminRef = useRef(isAdmin);
  const onMapClickRef = useRef(onMapClick);
  useEffect(() => { isAdminRef.current = isAdmin; }, [isAdmin]);
  useEffect(() => { onMapClickRef.current = onMapClick; }, [onMapClick]);

  const fetchLocations = () => {
    fetch('/api/locations')
      .then(res => res.json())
      .then(setLocations)
      .catch(err => console.error('Failed to fetch locations:', err));
  };

  useImperativeHandle(ref, () => ({
    flyTo: (coords: [number, number], zoom = 10) => {
      map.current?.flyTo({ center: coords, zoom, duration: 2000, essential: true });
    },
    refresh: fetchLocations,
  }));

  useEffect(() => { fetchLocations(); }, []);

  // 注册全局 gallery 开启函数
  // popup HTML 里传入的是原始 URL 数组（JSON 字符串），GalleryModal 直接用原图
  useEffect(() => {
    (window as any).__openMapGallery = (imagesJson: string) => {
      try {
        setGalleryImages(JSON.parse(imagesJson));
      } catch { /* noop */ }
    };
    return () => { delete (window as any).__openMapGallery; };
  }, []);

  // 初始化地图（只跑一次）
  useEffect(() => {
    if (!mapContainer.current || !MAPBOX_TOKEN || map.current) return;

    mapboxgl.accessToken = MAPBOX_TOKEN;

    try {
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/dark-v11',
        center: [0, 20],
        zoom: 1.5,
        projection: { name: 'globe' },
        antialias: true,
      });

      map.current.on('load', () => {
        if (!map.current) return;
        map.current.resize();
        map.current.setFog({
          color: 'rgb(186, 210, 235)',
          'high-color': 'rgb(36, 92, 223)',
          'horizon-blend': 0.02,
          'space-color': 'rgb(11, 11, 25)',
          'star-intensity': 0.6,
        });
      });

      map.current.on('click', (e) => {
        if (isAdminRef.current && onMapClickRef.current) {
          onMapClickRef.current(e.lngLat);
        }
      });

      const handleResize = () => map.current?.resize();
      window.addEventListener('resize', handleResize);

      return () => {
        window.removeEventListener('resize', handleResize);
        map.current?.remove();
        map.current = null;
      };
    } catch (error) {
      console.error('Mapbox initialization error:', error);
    }
  }, []);

  // 更新 markers
  useEffect(() => {
    if (!map.current) return;

    markers.current.forEach(m => m.remove());
    markers.current = [];

    locations.forEach((loc) => {
      if (!loc.images?.length) return;

      // 弹窗缩略图：经 CF Image Resizing 压缩，加载快
      const thumbnailUrl = cfThumb(loc.images[0], 400, 75);

      // 原图数组：原始 URL，不做任何处理
      // 注意：JSON.stringify 后再 replace 双引号为 &quot; 供 HTML 属性安全使用
      const originalImagesAttr = JSON.stringify(loc.images).replace(/"/g, '&quot;');

      const extraCount = loc.images.length - 1;

      const popup = new mapboxgl.Popup({
        offset: 25,
        closeButton: true,
        closeOnClick: false,
        className: 'custom-popup',
      }).setHTML(
        `<div class="p-2 text-gray-900 min-w-[220px]">
          <div class="relative mb-2">
            <img
              src="${thumbnailUrl}"
              class="w-full h-36 object-cover rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
              loading="lazy"
              onclick="window.__openMapGallery('${originalImagesAttr}')"
            />
            ${extraCount > 0
              ? `<span
                   class="absolute top-2 right-2 bg-black/70 text-white text-[10px] font-bold px-2 py-0.5 rounded-full cursor-pointer"
                   onclick="window.__openMapGallery('${originalImagesAttr}')"
                 >+${extraCount}</span>`
              : ''}
          </div>
          <h3 class="font-bold text-base leading-tight">${loc.name}</h3>
          <p class="text-[10px] text-gray-500 mb-1 uppercase font-bold tracking-wider">${loc.date}</p>
          <p class="text-sm text-gray-700 leading-relaxed">${loc.description}</p>
        </div>`
      );

      const marker = new mapboxgl.Marker({ color: '#3b82f6' })
        .setLngLat(loc.coordinates)
        .setPopup(popup)
        .addTo(map.current!);

      markers.current.push(marker);
    });
  }, [locations]);

  if (!MAPBOX_TOKEN) {
    return (
      <div className="w-full h-screen bg-neutral-900 flex items-center justify-center text-white p-8 text-center">
        <div className="max-w-md space-y-4">
          <h2 className="text-2xl font-bold">Mapbox Token Required</h2>
          <p className="text-neutral-400">Please add your Mapbox Access Token to the environment variables.</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div ref={mapContainer} className="w-full h-screen" />
      {galleryImages && (
        <GalleryModal images={galleryImages} onClose={() => setGalleryImages(null)} />
      )}
    </>
  );
});
