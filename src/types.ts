export interface JobCard {
  id: string;
  title: string;
  company: string;
  status: 'wishlist' | 'applied' | 'interview' | 'offer' | 'rejected';
  notes: string;
  position: { x: number; y: number };
}

export interface Column {
  id: string;
  title: string;
  status: JobCard['status'];
}