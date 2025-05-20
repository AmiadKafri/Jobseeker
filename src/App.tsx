import type React from "react"
import { useState, useEffect, useRef, useCallback } from "react"
import { Plus, X, LogOut, Download } from "lucide-react"
import { Column } from "./components/Column"
import { AuthModal } from "./components/AuthModal"
import { CompanyList } from "./components/CompanyList"
import { useAuth } from "./contexts/AuthContext"
import toast, { Toaster } from "react-hot-toast"
import type { JobCard, Column as ColumnType } from "./types"
import Papa from 'papaparse'
import * as api from './services/api'; // Import API service

const initialColumns: ColumnType[] = [
  { id: "1", title: "Wishlist", status: "wishlist" },
  { id: "2", title: "Applied", status: "applied" },
  { id: "3", title: "Interview", status: "interview" },
  { id: "4", title: "Offer", status: "offer" },
  { id: "5", title: "Rejected", status: "rejected" },
]

function App() {
  const [jobs, setJobs] = useState<JobCard[]>([])
  const [draggedJob, setDraggedJob] = useState<JobCard | null>(null)
  const [touchStartX, setTouchStartX] = useState<number | null>(null)
  const [touchStartY, setTouchStartY] = useState<number | null>(null)
  const [currentColumn, setCurrentColumn] = useState<string | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)
  const [newJob, setNewJob] = useState({
    title: "",
    company: "",
    notes: "",
  })
  const [isLoading, setIsLoading] = useState(false); // For general loading state

  const touchTimeoutRef = useRef<number | null>(null)
  const initialTouchRef = useRef<{ x: number; y: number } | null>(null)

  const { user, session, loading: authLoading } = useAuth()

  // Fetch initial jobs when user/session changes
  useEffect(() => {
    if (user && session) {
      setIsLoading(true);
      toast.promise(
        api.getJobs(session.access_token).then(fetchedJobs => {
          setJobs(fetchedJobs);
          return fetchedJobs;
        }),
        {
          loading: 'Fetching jobs...',
          success: 'Jobs loaded!',
          error: (err) => `Error fetching jobs: ${err.message}`,
        }
      ).finally(() => setIsLoading(false));
    } else if (!authLoading) { // Only clear jobs if not in initial auth loading phase
      setJobs([]); // Clear jobs if user signs out or no session
    }
  }, [user, session, authLoading]);


  const handleDragStart = (e: React.DragEvent, job: JobCard) => {
    setDraggedJob(job)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleDrop = async (e: React.DragEvent, status: JobCard["status"]) => {
    e.preventDefault()
    if (draggedJob && draggedJob.status !== status && session) {
      const originalJobs = [...jobs];
      const updatedJobOptimistic = { ...draggedJob, status };
      setJobs(jobs.map((job) => (job.id === draggedJob.id ? updatedJobOptimistic : job)));
      setDraggedJob(null);

      try {
        const updatedJobFromServer = await api.updateJob(session.access_token, draggedJob.id, { status });
        setJobs(prevJobs => prevJobs.map(job => job.id === updatedJobFromServer.id ? updatedJobFromServer : job));
        toast.success(`Moved to ${status}`);
      } catch (error: any) {
        setJobs(originalJobs); // Revert optimistic update
        toast.error(`Failed to move job: ${error.message}`);
      }
    } else {
      setDraggedJob(null); // Reset dragged job even if no change
    }
  }

  const handleTouchStart = (e: React.TouchEvent, job: JobCard) => {
    const touch = e.touches[0]
    setTouchStartX(touch.clientX)
    setTouchStartY(touch.clientY)
    initialTouchRef.current = { x: touch.clientX, y: touch.clientY }

    touchTimeoutRef.current = window.setTimeout(() => {
      setDraggedJob(job)
      setCurrentColumn(job.status) // Initial column status
      if (e.currentTarget instanceof HTMLElement) {
        e.currentTarget.style.transition = "transform 0.1s ease-out"
      }
    }, 100)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!draggedJob || !touchStartX || !touchStartY || !initialTouchRef.current) return

    const touch = e.touches[0]
    const moveX = touch.clientX - initialTouchRef.current.x
    const moveY = touch.clientY - initialTouchRef.current.y
    const distance = Math.sqrt(moveX * moveX + moveY * moveY)
    if (distance < 5) return

    if (touchTimeoutRef.current) {
      clearTimeout(touchTimeoutRef.current)
      touchTimeoutRef.current = null
    }

    const elementsUnderTouch = document.elementsFromPoint(touch.clientX, touch.clientY)
    const columnElement = elementsUnderTouch.find((el) => el.classList.contains("job-column"))

    if (columnElement) {
      const newStatus = columnElement.getAttribute("data-status") as JobCard["status"]
      if (newStatus && newStatus !== currentColumn) {
        setCurrentColumn(newStatus)
        columnElement.classList.add("bg-indigo-50", "scale-[1.02]")
        setTimeout(() => {
          columnElement.classList.remove("bg-indigo-50", "scale-[1.02]")
        }, 150)
      }
    }

    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.transform = `translate3d(${moveX}px, ${moveY}px, 0)`
      e.currentTarget.style.opacity = "0.95"
      e.currentTarget.style.boxShadow = "0 10px 25px -5px rgba(0, 0, 0, 0.1)"
    }
  }

  const handleTouchEnd = async (e: React.TouchEvent) => {
    if (touchTimeoutRef.current) {
      clearTimeout(touchTimeoutRef.current)
      touchTimeoutRef.current = null
    }
    
    const targetElement = e.currentTarget as HTMLElement;
    const resetStyle = () => {
      targetElement.style.transition = "all 0.2s ease-out";
      targetElement.style.transform = "";
      targetElement.style.opacity = "";
      targetElement.style.boxShadow = "";
      setTimeout(() => {
        targetElement.style.transition = "";
      }, 200);
    };

    if (!draggedJob || !currentColumn || !session) {
      if (targetElement) resetStyle();
      setDraggedJob(null);
      setTouchStartX(null);
      setTouchStartY(null);
      setCurrentColumn(null);
      initialTouchRef.current = null;
      return;
    }

    if (currentColumn !== draggedJob.status) {
      const originalJobs = [...jobs];
      const updatedJobOptimistic = { ...draggedJob, status: currentColumn };
      setJobs(jobs.map((job) => (job.id === draggedJob.id ? updatedJobOptimistic : job)));
      
      try {
        const updatedJobFromServer = await api.updateJob(session.access_token, draggedJob.id, { status: currentColumn });
        setJobs(prevJobs => prevJobs.map(job => job.id === updatedJobFromServer.id ? updatedJobFromServer : job));
        toast.success(`Moved to ${currentColumn}`, {
          duration: 2000, style: { background: "#4F46E5", color: "#fff" },
        });
      } catch (error: any) {
        setJobs(originalJobs); // Revert
        toast.error(`Failed to move job: ${error.message}`);
      }
    }
    
    if (targetElement) resetStyle();
    setDraggedJob(null);
    setTouchStartX(null);
    setTouchStartY(null);
    setCurrentColumn(null);
    initialTouchRef.current = null;
  }

  const handleAddJob = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !session) {
      toast.error("You must be logged in to add a job.");
      return;
    }

    // Using the refined AddJobPayload type from api.ts
    // title, company, notes are mandatory from newJob state.
    // status and position are optional and will be defaulted by api.ts or backend.
    const jobPayload: api.AddJobPayload = {
      title: newJob.title,
      company: newJob.company,
      notes: newJob.notes,
      status: 'wishlist', // Default status
      position: { x: 0, y: 0 } // Default position
    };

    setIsLoading(true);
    try {
      const addedJob = await api.addJob(session.access_token, jobPayload);
      setJobs(prevJobs => [...prevJobs, addedJob]);
      setNewJob({ title: "", company: "", notes: "" });
      setIsModalOpen(false);
      toast.success("Job added successfully!");
    } catch (error: any) {
      toast.error(`Failed to add job: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  }

  const handleDeleteJob = async (jobId: string) => {
    if (!user || !session) {
      toast.error("You must be logged in to delete a job.");
      return;
    }
    const originalJobs = [...jobs];
    setJobs(jobs.filter((job) => job.id !== jobId)); // Optimistic update

    try {
      await api.deleteJob(session.access_token, jobId);
      toast.success("Job deleted successfully!");
    } catch (error: any) {
      setJobs(originalJobs); // Revert
      toast.error(`Failed to delete job: ${error.message}`);
    }
  }

  const handleSelectCompany = (company: string) => {
    if (company) {
      setIsModalOpen(true)
      setNewJob((prev) => ({ ...prev, company }))
    }
  }

  const handleExport = () => {
    if (!jobs.length) {
      toast.error('No jobs to export')
      return
    }
    const exportData = jobs.map(({ id, position, ...job }) => ({
      company: job.company,
      title: job.title,
      status: job.status,
      notes: job.notes
    }))
    const csv = Papa.unparse(exportData)
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', 'jobs_export.csv')
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    toast.success('Exported jobs to CSV!')
  }
  
  // Sign out function from useAuth
  const handleSignOut = async () => {
    if (!session) return; // Should not happen if user is present
    try {
      await api.signOut(session.access_token); // Assuming signOut is part of your api service or directly useAuth's signOut
      // useAuth().signOut() already handles clearing local session/user state
      toast.success("Successfully signed out!");
    } catch (error: any) {
      toast.error(`Sign out failed: ${error.message}`);
    }
  };


  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100">
      <Toaster position="top-right" />
      <header className="bg-white shadow-md backdrop-filter backdrop-blur-lg bg-opacity-80">
        <div className="max-w-[1920px] mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl sm:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 to-pink-500">
              Job Search
            </h1>
            {user ? (
              <div className="flex items-center gap-2">
                <button
                  onClick={handleExport}
                  className="inline-flex items-center px-3 py-1.5 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  <Download className="h-4 w-4 mr-1" />
                  Export
                </button>
                <button
                  onClick={useAuth().signOut} // Using signOut from useAuth context
                  className="inline-flex items-center px-3 py-1.5 sm:px-4 sm:py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  <LogOut className="h-4 w-4 mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">Sign Out</span>
                </button>
              </div>
            ) : (
              <button
                onClick={() => setIsAuthModalOpen(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition duration-150 ease-in-out transform hover:scale-105"
              >
                Sign In
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-[1920px] mx-auto px-2 sm:px-4 lg:px-8 py-4 sm:py-8">
        { (authLoading || (user && isLoading)) && <div className="text-center py-10">Loading jobs...</div>}
        { !authLoading && !isLoading && user && (
          <div className="flex flex-col lg:flex-row gap-4 lg:gap-6">
            <div className="w-full lg:w-[400px] shrink-0">
              <CompanyList onSelectCompany={handleSelectCompany} />
              <div className="mt-4 lg:hidden">
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="w-full inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition duration-150 ease-in-out"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Job
                </button>
              </div>
            </div>
            <div className="w-full overflow-x-auto">
              <div className="hidden lg:flex lg:justify-end mb-4">
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition duration-150 ease-in-out"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Job
                </button>
              </div>
              <div className="inline-flex space-x-4 pb-4 min-w-full">
                {initialColumns.map((column) => (
                  <Column
                    key={column.id}
                    column={column}
                    jobs={jobs}
                    onDragStart={handleDragStart}
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                    onDeleteJob={handleDeleteJob}
                    onTouchStart={handleTouchStart}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={handleTouchEnd}
                  />
                ))}
              </div>
            </div>
          </div>
        )}
        { !authLoading && !user && (
          <div className="text-center py-12">
            <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 to-pink-500 mb-4">
              Welcome to Job Search Canvas
            </h2>
            <p className="text-gray-600 mb-8">Sign in to start tracking your job applications</p>
            <button
              onClick={() => setIsAuthModalOpen(true)}
              className="inline-flex items-center px-6 py-3 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition duration-150 ease-in-out transform hover:scale-105"
            >
              Get Started
            </button>
          </div>
        )}
      </main>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-xl transform transition-all duration-300 ease-in-out">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Add New Job</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-500 hover:text-gray-700">
                <X className="h-6 w-6" />
              </button>
            </div>
            <form onSubmit={handleAddJob}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Job Title</label>
                  <input
                    type="text"
                    required
                    value={newJob.title}
                    onChange={(e) => setNewJob({ ...newJob, title: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm transition duration-150 ease-in-out hover:border-indigo-400"
                    placeholder="e.g., Senior Frontend Developer"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Company</label>
                  <input
                    type="text"
                    required
                    value={newJob.company}
                    onChange={(e) => setNewJob({ ...newJob, company: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm transition duration-150 ease-in-out hover:border-indigo-400"
                    placeholder="e.g., TechCorp Inc."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Notes</label>
                  <textarea
                    value={newJob.notes}
                    onChange={(e) => setNewJob({ ...newJob, notes: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm transition duration-150 ease-in-out hover:border-indigo-400"
                    rows={3}
                    placeholder="Add any notes about the position..."
                  />
                </div>
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition duration-150 ease-in-out disabled:opacity-50"
                  >
                    {isLoading ? 'Adding...' : 'Add Job'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
    </div>
  )
}

export default App
