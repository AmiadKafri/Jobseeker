import React from 'react';
import { Building2, MessageSquare, Trash2 } from 'lucide-react';
import type { JobCard } from '../types';

interface JobNodeProps {
  job: JobCard;
  onDragStart: (e: React.DragEvent, job: JobCard) => void;
  onDelete: (jobId: string) => void;
  onTouchStart: (e: React.TouchEvent, job: JobCard) => void;
  onTouchMove: (e: React.TouchEvent) => void;
  onTouchEnd: (e: React.TouchEvent) => void;
}

export function JobNode({ job, onDragStart, onDelete, onTouchStart, onTouchMove, onTouchEnd }: JobNodeProps) {
  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, job)}
      onTouchStart={(e) => onTouchStart(e, job)}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      className="bg-white rounded-lg shadow-md p-4 w-[280px] cursor-move hover:shadow-lg group touch-manipulation will-change-transform"
      style={{ 
        touchAction: 'none',
        WebkitTapHighlightColor: 'transparent',
        WebkitTouchCallout: 'none',
        WebkitUserSelect: 'none',
        userSelect: 'none'
      }}
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="font-semibold text-lg text-gray-800">{job.title}</h3>
          <div className="flex items-center text-gray-600 mt-1">
            <Building2 size={16} className="mr-1" />
            <span className="text-sm">{job.company}</span>
          </div>
        </div>
        <div className="flex items-start gap-2">
          <div className={`
            px-2 py-1 rounded-full text-xs font-medium
            ${job.status === 'wishlist' ? 'bg-blue-100 text-blue-800' : ''}
            ${job.status === 'applied' ? 'bg-yellow-100 text-yellow-800' : ''}
            ${job.status === 'interview' ? 'bg-purple-100 text-purple-800' : ''}
            ${job.status === 'offer' ? 'bg-green-100 text-green-800' : ''}
            ${job.status === 'rejected' ? 'bg-red-100 text-red-800' : ''}
          `}>
            {job.status.charAt(0).toUpperCase() + job.status.slice(1)}
          </div>
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onDelete(job.id);
            }}
            className="text-gray-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
            title="Delete job"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>
      
      {job.notes && (
        <div className="text-sm text-gray-600 mt-2">
          <div className="flex items-start">
            <MessageSquare size={16} className="mr-1 mt-1 flex-shrink-0" />
            <p className="line-clamp-2">{job.notes}</p>
          </div>
        </div>
      )}
    </div>
  );
}