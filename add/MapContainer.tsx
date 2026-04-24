import { useEffect, useRef, useState, useImperativeHandle, forwardRef } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Location } from '@/src/types';
import { GalleryModal } from './GalleryModal';

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN || (process.env as any).VITE_MAPBOX_ACCESS_TOKEN;

// 统一的 Cloudflare 缩略图处理函数（用于地图 Marker）
function cfThumb(originalUrl: string, width = 400, quality = 75): string {
  if (!originalUrl) return '';
  if (import.meta.env.DEV) return originalUrl;
  const options = `width=${width},quality=${quality},format=auto`;
  return `/cdn-cgi/image/${options}/${originalUrl}`;
}

interface MapContainerProps {
  isAdmin?: boolean;
  onMapClick?: (lngLat: { lng: number; lat: number }) => void;
  onLocationsLoaded?: (locations: Location[]) => void;
  isCruising?: boolean;
}

export interface MapRef {
  flyTo: (coords: [number, number], zoom?: number) => void;
  // 新增 isInitialJump 参数
  cruiseFlyTo: (coords: [number, number], zoom: number, bearing: number, pitch: number, isInitialJump?: boolean) => Promise<void>;
  refresh: () => void;
}

export const MapContainer = forwardRef<MapRef, MapContainerProps>(
  ({ isAdmin, onMapClick, onLocationsLoaded, isCruising }, ref) => {
    const mapContainer = useRef<HTMLDivElement>(null);
    const map = useRef<mapboxgl.Map | null>(null);
    const markers = useRef<mapboxgl.Marker[]>([]);
    
    const planeMarkerRef = useRef<mapboxgl.Marker | null>(null);
    const routeCoordsRef = useRef<number[][]>([]);
    const onMoveListenerRef = useRef<(() => void) | null>(null);

    const [locations, setLocations] = useState<Location[]>([]);
    const [galleryImages, setGalleryImages] = useState<string[] | null>(null);

    const isAdminRef = useRef(isAdmin);
    const onMapClickRef = useRef(onMapClick);
    useEffect(() => { isAdminRef.current = isAdmin; }, [isAdmin]);
    useEffect(() => { onMapClickRef.current = onMapClick; }, [onMapClick]);

    const fetchLocations = () => {
      fetch('/api/locations')
        .then(res => res.json())
        .then(data => {
          setLocations(data);
          onLocationsLoaded?.(data);
        })
        .catch(err => console.error('Failed to fetch locations:', err));
    };

    useImperativeHandle(ref, () => ({
      flyTo: (coords: [number, number], zoom = 10) => {
        map.current?.flyTo({ center: coords, zoom, duration: 2000, essential: true });
      },

      // 接收 isInitialJump 参数
      cruiseFlyTo: (coords, zoom, bearing, pitch, isInitialJump = false) => {
        return new Promise<void>((resolve) => {
          if (!map.current) return resolve();

          if (onMoveListenerRef.current) {
            map.current.off('move', onMoveListenerRef.current);
          }

          // === 针对首个出发点或手动跳转的逻辑 ===
          if (isInitialJump) {
            // 清空航线
            const source = map.current.getSource('cruise-route') as mapboxgl.GeoJSONSource;
            if (source) {
              source.setData({ type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: [] } });
            }
            // 隐藏飞机
            if (planeMarkerRef.current) {
              planeMarkerRef.current.getElement().style.display = 'none';
            }
            // 仅做平滑视角移动
            map.current.once('moveend', () => resolve());
            map.current.flyTo({ center: coords, zoom, bearing, pitch, duration: 2500, essential: true });
            return;
          }
          // =====================================

          const startLngLat = map.current.getCenter();
          const targetLngLat = new mapboxgl.LngLat(coords[0], coords[1]);
          const dist = startLngLat.distanceTo(targetLngLat); 

          let duration = 3000;
          if (dist < 50000) duration = 2800;        
          else if (dist < 500000) duration = 3800;  
          else duration = Math.min(4500 + (dist / 1000000) * 800, 8000); 

          routeCoordsRef.current = [startLngLat.toArray()];
          if (planeMarkerRef.current) {
            planeMarkerRef.current.getElement().style.display = 'block';
            planeMarkerRef.current.setLngLat(startLngLat);
          }

          const onMove = () => {
            if (!map.current) return;
            const currentPoint = map.current.getCenter().toArray();
            const lastPoint = routeCoordsRef.current[routeCoordsRef.current.length - 1];

            if (currentPoint[0] === lastPoint[0] && currentPoint[1] === lastPoint[1]) return;

            const lon1 = lastPoint[0] * Math.PI / 180, lat1 = lastPoint[1] * Math.PI / 180;
            const lon2 = currentPoint[0] * Math.PI / 180, lat2 = currentPoint[1] * Math.PI / 180;
            const y = Math.sin(lon2 - lon1) * Math.cos(lat2);
            const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(lon2 - lon1);
            const brng = (Math.atan2(y, x) * 180 / Math.PI);

            if (planeMarkerRef.current) {
              planeMarkerRef.current.setRotation(brng);
              planeMarkerRef.current.setLngLat(currentPoint);
            }

            routeCoordsRef.current.push(currentPoint);

            const source = map.current.getSource('cruise-route') as mapboxgl.GeoJSONSource;
            if (source) {
              source.setData({
                type: 'Feature',
                properties: {},
                geometry: { type: 'LineString', coordinates: routeCoordsRef.current }
              });
            }
          };

          onMoveListenerRef.current = onMove;
          map.current.on('move', onMove);

          map.current.once('moveend', () => {
            if (onMoveListenerRef.current) map.current?.off('move', onMoveListenerRef.current);
            resolve();
          });

          map.current.triggerRepaint();

          map.current.flyTo({
            center: coords, zoom, bearing, pitch, duration, curve: 1.2, essential: true,
            easing: (t: number) => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2,
          });
        });
      },
      refresh: () => fetchLocations(),
    }));

    useEffect(() => {
      if (!isCruising && map.current) {
        const source = map.current.getSource('cruise-route') as mapboxgl.GeoJSONSource;
        if (source) {
          source.setData({ type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: [] } });
        }
        if (planeMarkerRef.current) {
          planeMarkerRef.current.getElement().style.display = 'none';
        }
      }
    }, [isCruising]);

    useEffect(() => { fetchLocations(); }, []);

    useEffect(() => {
      (window as any).__openMapGallery = (imagesJson: string) => {
        try { setGalleryImages(JSON.parse(imagesJson)); } catch { /* noop */ }
      };
      return () => { delete (window as any).__openMapGallery; };
    }, []);

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

          map.current.addSource('cruise-route', {
            type: 'geojson',
            data: { type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: [] } }
          });

          map.current.addLayer({
            id: 'cruise-route-line',
            type: 'line',
            source: 'cruise-route',
            layout: { 'line-join': 'round', 'line-cap': 'round' },
            paint: {
              'line-color': '#ffffff', 
              'line-width': 3,
              'line-dasharray': [2, 2], 
              'line-opacity': 0.7
            }
          });

          const planeEl = document.createElement('div');
          planeEl.style.display = 'none'; 
          planeEl.innerHTML = `
            <div style="transform: rotate(-45deg); filter: drop-shadow(0 4px 6px rgba(0,0,0,0.4));">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="white" stroke="#3b82f6" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21.5 4s-2 .5-3.5 2L14.5 9.5 6.3 7.7c-.9-.2-1.9.3-2.5 1.1L2.5 11c-.3.6 0 1.2.5 1.5l5.5 2.5-3 3-3-.5c-.5-.1-1 .2-1.2.7l-.8 1.5c-.2.5.2 1 .8 1l4.5 1 1 4.5c.1.6.6.9 1 .8l1.5-.8c.5-.2.8-.7.7-1.2l-.5-3 3-3 2.5 5.5c.3.5.9.8 1.5.5l2.2-1.3c.8-.6 1.3-1.6 1.1-2.5z"/>
              </svg>
            </div>
          `;
          planeMarkerRef.current = new mapboxgl.Marker({ 
            element: planeEl, 
            rotationAlignment: 'map', 
            pitchAlignment: 'map' 
          }).setLngLat([0,0]).addTo(map.current);
        });

        map.current.on('click', (e) => {
          if (isAdminRef.current && onMapClickRef.current) onMapClickRef.current(e.lngLat);
        });

        const handleResize = () => map.current?.resize();
        window.addEventListener('resize', handleResize);
        return () => {
          window.removeEventListener('resize', handleResize);
          map.current?.remove();
          map.current = null;
        };
      } catch (error) { console.error('Mapbox init error:', error); }
    }, []);

    useEffect(() => {
      if (!map.current) return;
      markers.current.forEach(m => m.remove());
      markers.current = [];

      locations.forEach((loc) => {
        // === 彻底应用缩略图加载逻辑 ===
        const thumbnail = loc.images[0] ? cfThumb(loc.images[0]) : '';
        const imagesJson = JSON.stringify(loc.images).replace(/'/g, "\\'");
        const extraCount = loc.images.length - 1;

        const popup = new mapboxgl.Popup({ offset: 25, closeButton: true, closeOnClick: false, className: 'custom-popup' }).setHTML(
          `<div class="p-2 text-gray-900 min-w-[220px]">
            ${thumbnail ? `
            <div class="relative mb-2">
              <img src="${thumbnail}" class="w-full h-36 object-cover rounded-lg cursor-pointer hover:opacity-90 transition-opacity" onclick="window.__openMapGallery('${imagesJson.replace(/"/g, '&quot;')}')" />
              ${extraCount > 0 ? `<span class="absolute top-2 right-2 bg-black/70 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">+${extraCount}</span>` : ''}
            </div>` : ''}
            <h3 class="font-bold text-base leading-tight">${loc.name}</h3>
            <p class="text-[10px] text-gray-500 mb-1 uppercase font-bold tracking-wider">${loc.date}</p>
            <p class="text-sm text-gray-700 leading-relaxed">${loc.description}</p>
          </div>`
        );
        const marker = new mapboxgl.Marker({ color: '#3b82f6' }).setLngLat(loc.coordinates).setPopup(popup).addTo(map.current!);
        markers.current.push(marker);
      });
    }, [locations]);

    if (!MAPBOX_TOKEN) return (<div className="w-full h-screen bg-neutral-900 flex items-center justify-center text-white"><p>Mapbox Token Required</p></div>);

    return (
      <>
        <div ref={mapContainer} className="w-full h-screen" />
        {galleryImages && !isCruising && (
          <GalleryModal images={galleryImages} onClose={() => setGalleryImages(null)} />
        )}
      </>
    );
  }
);
