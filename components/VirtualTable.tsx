import React, { useMemo, useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { NpmPackage } from '../types';
import { bytesToSize, getPercent } from '../helpers/utils';

interface VirtualTableProps {
  data: NpmPackage[];
  height?: number;
  itemHeight?: number;
}

const VirtualTable: React.FC<VirtualTableProps> = ({ 
  data, 
  height = 600, 
  itemHeight = 60 
}) => {
  const [scrollTop, setScrollTop] = useState(0);
  const scrollElementRef = useRef<HTMLDivElement>(null);

  const visibleItems = useMemo(() => {
    const containerHeight = height;
    const startIndex = Math.floor(scrollTop / itemHeight);
    const endIndex = Math.min(
      startIndex + Math.ceil(containerHeight / itemHeight) + 1,
      data.length
    );

    return data.slice(startIndex, endIndex).map((item, index) => ({
      ...item,
      index: startIndex + index,
    }));
  }, [data, scrollTop, height, itemHeight]);

  const totalHeight = data.length * itemHeight;
  const offsetY = Math.floor(scrollTop / itemHeight) * itemHeight;

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  };

  const renderRow = (item: NpmPackage & { index: number }) => {
    const latestVersion = item.versions[item['dist-tags'].latest];
    const currentSize = latestVersion?.dist?.unpackedSize || 0;
    const sizeDisplay = bytesToSize(currentSize, 2, true);
    
    const versionKeys = Object.keys(item.versions);
    let changeIndicator = <b> - </b>;
    
    if (versionKeys.length >= 2) {
      const previousVersion = item.versions[versionKeys[versionKeys.length - 2]];
      const previousSize = previousVersion?.dist?.unpackedSize || 0;
      
      if (previousSize > 0) {
        const percentChange = parseFloat(getPercent(previousSize, currentSize));
        
        if (percentChange > 0) {
          changeIndicator = <b className="text-red-400"> ↗ </b>;
        } else if (percentChange < 0) {
          changeIndicator = <b className="text-green-400"> ↘ </b>;
        }
      }
    }

    return (
      <div
        key={item._id}
        className="flex items-center hover:bg-gray-100 dark:hover:bg-gray-700 border-b border-gray-200 dark:border-gray-700"
        style={{
          height: itemHeight,
          position: 'absolute',
          top: item.index * itemHeight,
          left: 0,
          right: 0,
          width: '100%',
        }}
      >
        <div className="flex-1 cursor-pointer px-6 py-4 text-sm font-medium text-gray-800 dark:text-gray-200 truncate">
          <Link
            href={{
              pathname: "/" + item._rev,
              query: { name: item.name },
            }}
          >
            {item.name}
          </Link>
        </div>
        <div className="flex-1 px-6 py-4 text-sm text-gray-800 dark:text-gray-200">
          {item['dist-tags'].latest}
        </div>
        <div className="flex-1 px-6 py-4 text-sm text-gray-800 dark:text-gray-200">
          {latestVersion?.dist?.fileCount || 'N/A'}
        </div>
        <div className="flex-1 px-6 py-4 text-sm text-gray-800 dark:text-gray-200">
          {sizeDisplay} {changeIndicator}
        </div>
      </div>
    );
  };

  return (
    <div className="overflow-hidden border border-gray-200 dark:border-gray-700 rounded-xl">
      {/* Header */}
      <div className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="flex">
          <div className="flex-1 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
            Module name
          </div>
          <div className="flex-1 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
            Version
          </div>
          <div className="flex-1 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
            Number of files
          </div>
          <div className="flex-1 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
            Filesize
          </div>
        </div>
      </div>

      {/* Virtual scrollable content */}
      <div
        ref={scrollElementRef}
        style={{ height, overflow: 'auto' }}
        onScroll={handleScroll}
      >
        <div style={{ height: totalHeight, position: 'relative' }}>
          <div style={{ transform: `translateY(${offsetY}px)` }}>
            {visibleItems.map(renderRow)}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VirtualTable;