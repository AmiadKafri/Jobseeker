import type React from "react"
import { useState, useEffect, useRef } from "react"
import { Plus, X, LogOut, Download } from "lucide-react"
import { Column } from "./components/Column"
import { AuthModal } from "./components/AuthModal"
import { CompanyList } from "./components/CompanyList"
import { useAuth } from "./contexts/AuthContext"
import toast, { Toaster } from "react-hot-toast"
import type { JobCard, Column as ColumnType } from "./types"
import Papa from 'papaparse'

const initialColumns: ColumnType[] = [
  { id: "1", title: "Wishlist", status: "wishlist" },
  { id: "2", title: "Applied", status: "applied" },
  { id: "3", title: "Interview", status: "interview" },
  { id: "4", title: "Offer", status: "offer" },
  { id: "5", title: "Rejected", status: "rejected" },
]

function App() {
  const [jobs, setJobs] = useState<JobCard[]>(() => {
    const savedJobs = localStorage.getItem("jobs")
    return savedJobs ? JSON.parse(savedJobs) : []
  })
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
  const touchTimeoutRef = useRef<number | null>(null)
  const initialTouchRef = useRef<{ x: number; y: number } | null>(null)

  const { user, signOut } = useAuth()

  useEffect(() => {
    localStorage.setItem("jobs", JSON.stringify(jobs))
  }, [jobs])

  const handleDragStart = (e: React.DragEvent, job: JobCard) => {
    setDraggedJob(job)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleDrop = (e: React.DragEvent, status: JobCard["status"]) => {
    e.preventDefault()
    if (draggedJob) {
      const updatedJobs = jobs.map((job) => (job.id === draggedJob.id ? { ...job, status } : job))
      setJobs(updatedJobs)
      setDraggedJob(null)
    }
  }

  const handleTouchStart = (e: React.TouchEvent, job: JobCard) => {
    const touch = e.touches[0]
    setTouchStartX(touch.clientX)
    setTouchStartY(touch.clientY)
    initialTouchRef.current = { x: touch.clientX, y: touch.clientY }

    // Add a small delay before starting the drag to prevent accidental drags
    touchTimeoutRef.current = window.setTimeout(() => {
      setDraggedJob(job)
      setCurrentColumn(job.status)
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

    // Calculate movement distance to determine if it's a significant drag
    const distance = Math.sqrt(moveX * moveX + moveY * moveY)
    if (distance < 5) return // Ignore small movements

    if (touchTimeoutRef.current) {
      clearTimeout(touchTimeoutRef.current)
      touchTimeoutRef.current = null
    }

    // Find the column element under the touch point
    const elementsUnderTouch = document.elementsFromPoint(touch.clientX, touch.clientY)
    const columnElement = elementsUnderTouch.find((el) => el.classList.contains("job-column"))

    if (columnElement) {
      const newStatus = columnElement.getAttribute("data-status") as JobCard["status"]
      if (newStatus && newStatus !== currentColumn) {
        setCurrentColumn(newStatus)
        // Enhanced visual feedback
        columnElement.classList.add("bg-indigo-50", "scale-[1.02]")
        setTimeout(() => {
          columnElement.classList.remove("bg-indigo-50", "scale-[1.02]")
        }, 150)
      }
    }

    // Smooth movement of the dragged element
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.transform = `translate3d(${moveX}px, ${moveY}px, 0)`
      e.currentTarget.style.opacity = "0.95"
      e.currentTarget.style.boxShadow = "0 10px 25px -5px rgba(0, 0, 0, 0.1)"
    }
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchTimeoutRef.current) {
      clearTimeout(touchTimeoutRef.current)
      touchTimeoutRef.current = null
    }

    if (!draggedJob || !currentColumn) {
      if (e.currentTarget instanceof HTMLElement) {
        e.currentTarget.style.transform = ""
        e.currentTarget.style.opacity = ""
        e.currentTarget.style.boxShadow = ""
      }
      return
    }

    if (currentColumn !== draggedJob.status) {
      const updatedJobs = jobs.map((job) => (job.id === draggedJob.id ? { ...job, status: currentColumn } : job))
      setJobs(updatedJobs)

      // Enhanced success feedback
      toast.success(`Moved to ${currentColumn}`, {
        duration: 2000,
        style: {
          background: "#4F46E5",
          color: "#fff",
        },
      })
    }

    // Smooth reset of the dragged element
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.transition = "all 0.2s ease-out"
      e.currentTarget.style.transform = ""
      e.currentTarget.style.opacity = ""
      e.currentTarget.style.boxShadow = ""

      // Reset transition after animation completes
      setTimeout(() => {
        e.currentTarget.style.transition = ""
      }, 200)
    }

    setDraggedJob(null)
    setTouchStartX(null)
    setTouchStartY(null)
    setCurrentColumn(null)
    initialTouchRef.current = null
  }

  const handleAddJob = (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    const newJobData: JobCard = {
      id: crypto.randomUUID(),
      ...newJob,
      status: "wishlist",
      position: { x: 0, y: 0 },
    }

    setJobs([...jobs, newJobData])
    setNewJob({ title: "", company: "", notes: "" })
    setIsModalOpen(false)
    toast.success("Job added successfully!")
  }

  const handleDeleteJob = (jobId: string) => {
    setJobs(jobs.filter((job) => job.id !== jobId))
    toast.success("Job deleted successfully!")
  }

  const handleSelectCompany = (company: string) => {
    if (company) {
      setIsModalOpen(true)
      setNewJob((prev) => ({ ...prev, company }))
    }
  }

  // פונקציה לייצוא כל המשרות לקובץ CSV
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
                  onClick={() => signOut()}
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
        {user ? (
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
        ) : (
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
                    className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition duration-150 ease-in-out"
                  >
                    Add Job
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

