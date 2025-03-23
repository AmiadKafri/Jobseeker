import React, { useState, useEffect, useRef } from "react"
import { Building2, Plus, Check, X, MoreHorizontal, Star, Trash2, GripVertical } from "lucide-react"

// Extended list of major companies worldwide
const companyOptions = [
  "Accenture",
  "Adobe",
  // ... (keeping all existing companies)
].sort()

interface CompanyEntry {
  id: string
  company: string
  customCompany: string
  updated: boolean
  lastUpdated: string | null
}

interface CompanyListProps {
  onSelectCompany: (company: string) => void
}

export function CompanyList({ onSelectCompany }: CompanyListProps) {
  const [companies, setCompanies] = useState<CompanyEntry[]>(() => {
    const saved = localStorage.getItem("companyTracking")
    return saved ? JSON.parse(saved) : []
  })
  const [isFrequencyMenuOpen, setIsFrequencyMenuOpen] = useState(false)
  const [updateFrequency, setUpdateFrequency] = useState<"daily" | "weekly" | null>(null)
  const [starredCompanies, setStarredCompanies] = useState<string[]>(() => {
    const saved = localStorage.getItem("starredCompanies")
    return saved ? JSON.parse(saved) : []
  })
  const [isListVisible, setIsListVisible] = useState(true)
  const [draggedItem, setDraggedItem] = useState<CompanyEntry | null>(null)
  const [dragOverItemId, setDragOverItemId] = useState<string | null>(null)

  useEffect(() => {
    localStorage.setItem("companyTracking", JSON.stringify(companies))
  }, [companies])

  useEffect(() => {
    localStorage.setItem("starredCompanies", JSON.stringify(starredCompanies))
  }, [starredCompanies])

  useEffect(() => {
    const checkUpdates = () => {
      const today = new Date().toISOString().split("T")[0]
      if (updateFrequency === "daily") {
        setCompanies((prevCompanies) =>
          prevCompanies.map((company) => {
            if (company.lastUpdated !== today) {
              return { ...company, updated: false }
            }
            return company
          }),
        )
      } else if (updateFrequency === "weekly") {
        const weekAgo = new Date()
        weekAgo.setDate(weekAgo.getDate() - 7)
        setCompanies((prevCompanies) =>
          prevCompanies.map((company) => {
            if (!company.lastUpdated || new Date(company.lastUpdated) < weekAgo) {
              return { ...company, updated: false }
            }
            return company
          }),
        )
      }
    }

    checkUpdates()
    const interval = setInterval(checkUpdates, 1000 * 60 * 60)
    return () => clearInterval(interval)
  }, [updateFrequency])

  const addNewRow = () => {
    setCompanies([
      ...companies,
      {
        id: crypto.randomUUID(),
        company: "",
        customCompany: "",
        updated: false,
        lastUpdated: null,
      },
    ])
  }

  const updateCompany = (id: string, company: string) => {
    setCompanies(companies.map((c) => (c.id === id ? { ...c, company, customCompany: "" } : c)))
  }

  const updateCustomCompany = (id: string, customCompany: string) => {
    setCompanies(companies.map((c) => (c.id === id ? { ...c, company: "", customCompany } : c)))
  }

  const toggleUpdated = (id: string) => {
    const today = new Date().toISOString().split("T")[0]
    setCompanies(
      companies.map((c) =>
        c.id === id
          ? {
              ...c,
              updated: !c.updated,
              lastUpdated: !c.updated ? today : c.lastUpdated,
            }
          : c,
      ),
    )
  }

  const toggleStar = (id: string) => {
    setStarredCompanies((prev) => (prev.includes(id) ? prev.filter((cId) => cId !== id) : [...prev, id]))
  }

  const deleteCompany = (id: string) => {
    setCompanies((prev) => prev.filter((c) => c.id !== id))
    setStarredCompanies((prev) => prev.filter((cId) => cId !== id))
  }

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, item: CompanyEntry) => {
    setDraggedItem(item)
    e.currentTarget.classList.add("opacity-50")
    e.dataTransfer.effectAllowed = "move"
  }

  const handleDragEnd = (e: React.DragEvent<HTMLDivElement>) => {
    e.currentTarget.classList.remove("opacity-50")
    setDraggedItem(null)
    setDragOverItemId(null)
  }

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>, itemId: string) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = "move"
    setDragOverItemId(itemId)
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>, targetId: string) => {
    e.preventDefault()
    if (!draggedItem || draggedItem.id === targetId) return

    const newCompanies = [...companies]
    const draggedIndex = newCompanies.findIndex((c) => c.id === draggedItem.id)
    const targetIndex = newCompanies.findIndex((c) => c.id === targetId)

    newCompanies.splice(draggedIndex, 1)
    newCompanies.splice(targetIndex, 0, draggedItem)

    setCompanies(newCompanies)
    setDraggedItem(null)
    setDragOverItemId(null)
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-4 w-full">
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={addNewRow}
          className="flex items-center gap-1 px-3 py-2 text-sm text-white bg-indigo-600 rounded-md hover:bg-indigo-700 transition-colors"
        >
          <Plus size={16} />
          Add Company
        </button>
        <button
          onClick={() => setIsListVisible(!isListVisible)}
          className="flex items-center gap-1 px-3 py-2 text-sm text-indigo-600 border border-indigo-600 rounded-md hover:bg-indigo-50 transition-colors"
        >
          {isListVisible ? "Hide List" : "Show List"}
        </button>
      </div>

      {isListVisible && (
        <>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Building2 className="text-indigo-600" />
              <h2 className="text-lg font-semibold text-gray-800">Companies</h2>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-600">Updated</span>
              <div className="relative">
                <button
                  onClick={() => setIsFrequencyMenuOpen(!isFrequencyMenuOpen)}
                  className={`p-1 hover:bg-gray-100 rounded-full ${updateFrequency ? "bg-gray-100" : ""}`}
                  title={updateFrequency ? `Update frequency: ${updateFrequency}` : "Set update frequency"}
                >
                  <MoreHorizontal size={16} className={`${updateFrequency ? "text-gray-700" : "text-gray-600"}`} />
                </button>
                {isFrequencyMenuOpen && (
                  <div className="absolute right-0 mt-1 w-32 bg-white border border-gray-200 rounded-md shadow-lg z-10">
                    <div className="py-1">
                      <button
                        onClick={() => {
                          setUpdateFrequency("daily")
                          setIsFrequencyMenuOpen(false)
                        }}
                        className={`flex items-center justify-between w-full px-4 py-2 text-sm text-left hover:bg-gray-100 ${
                          updateFrequency === "daily" ? "text-gray-900 bg-gray-50" : "text-gray-700"
                        }`}
                      >
                        <span>Daily</span>
                        {updateFrequency === "daily" && <Check size={16} className="text-gray-600" />}
                      </button>
                      <button
                        onClick={() => {
                          setUpdateFrequency("weekly")
                          setIsFrequencyMenuOpen(false)
                        }}
                        className={`flex items-center justify-between w-full px-4 py-2 text-sm text-left hover:bg-gray-100 ${
                          updateFrequency === "weekly" ? "text-gray-900 bg-gray-50" : "text-gray-700"
                        }`}
                      >
                        <span>Weekly</span>
                        {updateFrequency === "weekly" && <Check size={16} className="text-gray-600" />}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="max-h-[calc(100vh-300px)] overflow-y-auto pr-2 space-y-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
            {[...companies]
              .sort((a, b) => {
                if (starredCompanies.includes(a.id) && !starredCompanies.includes(b.id)) return -1
                if (!starredCompanies.includes(a.id) && starredCompanies.includes(b.id)) return 1
                return 0
              })
              .map((entry) => (
                <div
                  key={entry.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, entry)}
                  onDragEnd={handleDragEnd}
                  onDragOver={(e) => handleDragOver(e, entry.id)}
                  onDrop={(e) => handleDrop(e, entry.id)}
                  className={`flex items-center gap-3 bg-white rounded-md p-2 transition-colors ${
                    dragOverItemId === entry.id ? "border-2 border-indigo-300" : "border-2 border-transparent"
                  }`}
                >
                  <div className="cursor-move text-gray-400 hover:text-gray-600">
                    <GripVertical size={20} />
                  </div>
                  <button
                    onClick={() => toggleStar(entry.id)}
                    className={`text-yellow-400 hover:text-yellow-500 transition-colors ${
                      starredCompanies.includes(entry.id) ? "opacity-100" : "opacity-30"
                    }`}
                  >
                    <Star size={20} fill={starredCompanies.includes(entry.id) ? "currentColor" : "none"} />
                  </button>
                  <div className="flex-1">
                    <div className="relative">
                      <select
                        value={entry.company}
                        onChange={(e) => {
                          const value = e.target.value
                          if (value === "custom") {
                            updateCustomCompany(entry.id, entry.customCompany || "")
                          } else {
                            updateCompany(entry.id, value)
                          }
                        }}
                        className="w-full p-2 text-sm border border-gray-300 rounded-md focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                      >
                        <option value="">Select a company</option>
                        {companyOptions.map((company) => (
                          <option key={company} value={company}>
                            {company}
                          </option>
                        ))}
                        <option value="custom">Enter custom company</option>
                      </select>
                      {entry.company === "" && (
                        <input
                          type="text"
                          value={entry.customCompany}
                          onChange={(e) => updateCustomCompany(entry.id, e.target.value)}
                          placeholder="Enter custom company name"
                          className="absolute inset-0 w-full p-2 text-sm border border-gray-300 rounded-md focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                        />
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => toggleUpdated(entry.id)}
                    className={`w-8 h-8 flex items-center justify-center rounded-md border transition-colors ${
                      !entry.updated
                        ? "bg-red-50 border-red-200 text-red-600"
                        : "bg-green-50 border-green-200 text-green-600"
                    }`}
                  >
                    {!entry.updated ? <X className="w-5 h-5" /> : <Check className="w-5 h-5" />}
                  </button>
                  <button
                    onClick={() => deleteCompany(entry.id)}
                    className="text-red-500 hover:text-red-600 transition-colors"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
              ))}
          </div>
        </>
      )}
    </div>
  )
}