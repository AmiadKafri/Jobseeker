import React from 'react';
import type { Column as ColumnType, JobCard } from '../types';
import { JobNode } from './JobNode';

interface ColumnProps {
  column: ColumnType;
  jobs: JobCard[];
  onDragStart: (e: React.DragEvent, job: JobCard) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent, status: JobCard['status']) => void;
  onDeleteJob: (jobId: string) => void;
  onTouchStart: (e: React.TouchEvent, job: JobCard) => void;
  onTouchMove: (e: React.TouchEvent) => void;
  onTouchEnd: (e: React.TouchEvent) => void;
}

export function Column({ 
  column, 
  jobs, 
  onDragStart, 
  onDragOver, 
  onDrop, 
  onDeleteJob,
  onTouchStart,
  onTouchMove,
  onTouchEnd
}: ColumnProps) {
  return (
    <div
      className="job-column bg-gray-50 rounded-lg p-4 min-w-[300px] transition-colors duration-200"
      data-status={column.status}
      onDragOver={onDragOver}
      onDrop={(e) => onDrop(e, column.status)}
    >
      <h2 className="text-lg font-semibold mb-4 text-gray-700">{column.title}</h2>
      <div className="space-y-4">
        {jobs.filter(Boolean).filter(job => job.status === column.status).map(job => (
          <JobNode 
            key={job.id} 
            job={job} 
            onDragStart={onDragStart}
            onDelete={onDeleteJob}
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
          />
        ))}
      </div>
    </div>
  );
}