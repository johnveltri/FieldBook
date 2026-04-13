```App.tsx
import React, { useState, memo } from 'react'
import {
  Screen,
  Job,
  Session,
  MaterialEntry,
  Note,
  Attachment,
  JobRollup,
  ActiveSessionState,
  InboxCapture,
  JobWorkStatus,
} from './src/types'
import {
  initialJobs,
  initialSessions,
  initialMaterials,
  initialNotes,
  initialAttachments,
  initialInboxCaptures,
  buildJobRollups,
} from './src/data'
import { BottomNav } from './src/components/BottomNav'
import { HomeDashboard } from './src/pages/HomeDashboard'
import { JobList } from './src/pages/JobList'
import { JobDetail } from './src/pages/JobDetail'
import { AddMaterial } from './src/pages/AddMaterial'
import { JobSummary } from './src/pages/JobSummary'
import { AddNote } from './src/pages/AddNote'
import { QuickCaptureSheet } from './src/components/QuickCaptureSheet'
import { ActiveSession } from './src/components/ActiveSession'
import { InboxSheet } from './src/components/InboxSheet'
import { Profile } from './src/pages/Profile'
export function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('home')
  const [previousScreen, setPreviousScreen] = useState<Screen>('home')
  const [jobs, setJobs] = useState<Job[]>(initialJobs)
  const [sessions, setSessions] = useState<Session[]>(initialSessions)
  const [materials, setMaterials] = useState<MaterialEntry[]>(initialMaterials)
  const [notes, setNotes] = useState<Note[]>(initialNotes)
  const [attachments, setAttachments] =
    useState<Attachment[]>(initialAttachments)
  const [inboxCaptures, setInboxCaptures] =
    useState<InboxCapture[]>(initialInboxCaptures)
  const [selectedJobId, setSelectedJobId] = useState<string | undefined>()
  const [isQuickCaptureOpen, setIsQuickCaptureOpen] = useState(false)
  const [activeSession, setActiveSession] = useState<ActiveSessionState | null>(
    null,
  )
  const [userTrades, setUserTrades] = useState<string[]>([
    'Plumbing',
    'Handyman / General Home Services',
  ])
  const [initialEditMode, setInitialEditMode] = useState(false)
  const [pendingInboxCaptureId, setPendingInboxCaptureId] = useState<
    string | null
  >(null)
  const [pendingNewJobId, setPendingNewJobId] = useState<string | null>(null)
  const [jobListFilter, setJobListFilter] = useState<'ALL' | 'OPEN' | 'PAID'>(
    'ALL',
  )
  // Build rollups for UI
  const jobRollups = buildJobRollups(
    jobs,
    sessions,
    materials,
    notes,
    attachments,
  )
  const handleNavigate = (
    screen: Screen,
    jobId?: string,
    editMode: boolean = false,
  ) => {
    if (jobId) setSelectedJobId(jobId)
    if (screen === 'jobDetail' && currentScreen !== 'jobDetail') {
      setPreviousScreen(currentScreen)
    }
    // Reset job list filter when navigating to jobs without explicit filter
    if (screen === 'jobs' && currentScreen !== 'earnings') {
      setJobListFilter('ALL')
    }
    setInitialEditMode(editMode)
    setCurrentScreen(screen)
  }
  const handleUpdateWorkStatus = (jobId: string, status: JobWorkStatus) => {
    setJobs(
      jobs.map((j) => {
        if (j.id !== jobId) return j
        const updates: Partial<Job> = {
          job_work_status: status,
        }
        if (status === 'paid') {
          // Mark as paid — set collected amount
          updates.direct_collected_amount = j.direct_revenue_amount
        } else if (j.job_work_status === 'paid') {
          // Reverting from paid — clear collected amount
          updates.direct_collected_amount = null
        }
        return {
          ...j,
          ...updates,
          updated_at: new Date().toISOString(),
        }
      }),
    )
  }
  const handleUpdateJob = (
    updatedFields: Partial<Job> & {
      id: string
    },
  ) => {
    setJobs(
      jobs.map((j) => {
        if (j.id === updatedFields.id) {
          return {
            ...j,
            ...updatedFields,
            updated_at: new Date().toISOString(),
          }
        }
        return j
      }),
    )
  }
  // Helper: touch job updated_at whenever a child record changes
  const touchJobUpdatedAt = (jobId: string) => {
    const now = new Date().toISOString()
    setJobs((prev) =>
      prev.map((j) =>
        j.id === jobId
          ? {
              ...j,
              updated_at: now,
            }
          : j,
      ),
    )
  }
  const handleDeleteSession = (sessionId: string) => {
    const session = sessions.find((s) => s.id === sessionId)
    setSessions(sessions.filter((s) => s.id !== sessionId))
    if (session) touchJobUpdatedAt(session.job_id)
  }
  const handleDeleteMaterial = (materialId: string) => {
    const material = materials.find((m) => m.id === materialId)
    setMaterials(materials.filter((m) => m.id !== materialId))
    if (material?.job_id) touchJobUpdatedAt(material.job_id)
  }
  const handleUpdateMaterial = (
    materialId: string,
    updates: Partial<MaterialEntry>,
  ) => {
    const material = materials.find((m) => m.id === materialId)
    setMaterials(
      materials.map((m) =>
        m.id === materialId
          ? {
              ...m,
              ...updates,
              updated_at: new Date().toISOString(),
            }
          : m,
      ),
    )
    if (material?.job_id) touchJobUpdatedAt(material.job_id)
  }
  const handleDeleteNote = (noteId: string) => {
    const note = notes.find((n) => n.id === noteId)
    setNotes(notes.filter((n) => n.id !== noteId))
    if (note?.job_id) touchJobUpdatedAt(note.job_id)
  }
  const handleUpdateNote = (noteId: string, updates: Partial<Note>) => {
    const note = notes.find((n) => n.id === noteId)
    setNotes(
      notes.map((n) =>
        n.id === noteId
          ? {
              ...n,
              ...updates,
              updated_at: new Date().toISOString(),
            }
          : n,
      ),
    )
    if (note?.job_id) touchJobUpdatedAt(note.job_id)
  }
  const handleUpdateSession = (
    sessionId: string,
    updates: Partial<Session>,
  ) => {
    const session = sessions.find((s) => s.id === sessionId)
    setSessions(
      sessions.map((s) => {
        if (s.id === sessionId) {
          return {
            ...s,
            ...updates,
            updated_at: new Date().toISOString(),
          }
        }
        return s
      }),
    )
    if (session) touchJobUpdatedAt(session.job_id)
  }
  const handleAddMaterial = (
    jobId: string,
    material: Omit<MaterialEntry, 'id' | 'created_at' | 'updated_at'>,
  ) => {
    const now = new Date().toISOString()
    const newMaterial: MaterialEntry = {
      ...material,
      id: `m_${Date.now()}`,
      created_at: now,
      updated_at: now,
    }
    setMaterials([...materials, newMaterial])
    touchJobUpdatedAt(jobId)
  }
  const handleAddNote = (
    jobId: string,
    note: Omit<Note, 'id' | 'created_at' | 'updated_at'>,
  ) => {
    const now = new Date().toISOString()
    const newNote: Note = {
      ...note,
      id: `n_${Date.now()}`,
      created_at: now,
      updated_at: now,
    }
    setNotes([...notes, newNote])
    touchJobUpdatedAt(jobId)
  }
  const handleAddAttachment = (
    jobId: string,
    attachment: Omit<Attachment, 'id' | 'created_at' | 'updated_at'>,
  ) => {
    const now = new Date().toISOString()
    const newAttachment: Attachment = {
      ...attachment,
      id: `a_${Date.now()}`,
      created_at: now,
      updated_at: now,
    }
    setAttachments([...attachments, newAttachment])
    touchJobUpdatedAt(jobId)
  }
  const handleAddPastSession = (
    jobId: string,
    startedAt: string,
    endedAt: string,
    _revenue: number | null,
    sessionId?: string,
  ) => {
    const now = new Date().toISOString()
    const newSession: Session = {
      id: sessionId ?? `s_${Date.now()}`,
      job_id: jobId,
      entry_mode: 'manual',
      session_status: 'ended',
      started_at: startedAt,
      ended_at: endedAt,
      discarded_at: null,
      created_at: now,
      updated_at: now,
    }
    setSessions([...sessions, newSession])
    touchJobUpdatedAt(jobId)
  }
  const handleStartSession = (jobId: string) => {
    const job = jobRollups.find((j) => j.id === jobId)
    if (!job) return
    // If we're on the job detail page, close it so the active session takeover is the full experience
    if (currentScreen === 'jobDetail') {
      setCurrentScreen(previousScreen)
      setSelectedJobId(undefined)
    }
    setActiveSession({
      sessionId: `s_${Date.now()}`,
      jobId,
      jobName: job.short_description || 'Untitled Job',
      startedAt: new Date().toISOString(),
      isExpanded: true,
    })
  }
  const handleCreateJob = (description: string = ''): string => {
    const d = new Date()
    const now = d.toISOString()
    const localDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    const newJobId = `j_${Date.now()}`
    const newJob: Job = {
      id: newJobId,
      created_via: 'add_job',
      job_date: localDate,
      short_description: description || null,
      job_type: null,
      customer_name: null,
      service_address: null,
      job_work_status: 'not_started',
      no_materials_confirmed: false,
      direct_revenue_amount: null,
      direct_collected_amount: null,
      created_at: now,
      updated_at: now,
    }
    setJobs((prev) => [...prev, newJob])
    return newJobId
  }
  const handleCreateJobAndOpenDetail = () => {
    const newJobId = handleCreateJob('')
    setPendingNewJobId(newJobId)
    handleNavigate('jobDetail', newJobId, true)
  }
  // When assigning an inbox capture to a newly created job:
  // 1. store the inbox capture ID
  // 2. create the new job
  // 3. store the new job ID
  // 4. on first save, attach the capture to that job
  // 5. clear both pending values on success or cancel
  const handleCreateJobAndAssign = (captureId: string) => {
    const newJobId = handleCreateJob('')
    setPendingInboxCaptureId(captureId)
    handleNavigate('jobDetail', newJobId, true)
  }
  const handleQuickStartSession = () => {
    const now = new Date()
    const timestamp = now.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    })
    const description = `Live Session ${timestamp}`
    const isoNow = now.toISOString()
    const localDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
    const newJobId = `j_${Date.now()}`
    const newJob: Job = {
      id: newJobId,
      created_via: 'session_start',
      job_date: localDate,
      short_description: description,
      job_type: null,
      customer_name: null,
      service_address: null,
      job_work_status: 'in_progress',
      no_materials_confirmed: false,
      direct_revenue_amount: null,
      direct_collected_amount: null,
      created_at: isoNow,
      updated_at: isoNow,
    }
    setJobs((prev) => [...prev, newJob])
    setActiveSession({
      sessionId: `s_${Date.now()}`,
      jobId: newJobId,
      jobName: description,
      startedAt: isoNow,
      isExpanded: true,
    })
  }
  const handleRenameActiveSessionJob = (newName: string) => {
    if (!activeSession) return
    // Update the job
    setJobs((prev) =>
      prev.map((j) =>
        j.id === activeSession.jobId
          ? {
              ...j,
              short_description: newName,
              updated_at: new Date().toISOString(),
            }
          : j,
      ),
    )
    // Update the active session display name
    setActiveSession({
      ...activeSession,
      jobName: newName,
    })
  }
  const handleAssignInboxCapture = (captureId: string, jobId: string) => {
    const capture = inboxCaptures.find((c) => c.id === captureId)
    if (!capture) return
    if (capture.type === 'note') {
      const newNote: Note = {
        id: `n_${Date.now()}`,
        job_id: jobId,
        session_id: null,
        body: capture.body || '',
        created_at: capture.created_at,
        updated_at: new Date().toISOString(),
      }
      setNotes([...notes, newNote])
    } else if (capture.type === 'photo') {
      const newAttachment: Attachment = {
        id: `a_${Date.now()}`,
        job_id: jobId,
        session_id: null,
        attachment_role: 'photo',
        file_name: capture.file_url,
        file_url: capture.file_url || '',
        created_at: capture.created_at,
        updated_at: new Date().toISOString(),
      }
      setAttachments([...attachments, newAttachment])
    } else if (capture.type === 'voice_memo') {
      const newNote: Note = {
        id: `n_${Date.now()}`,
        job_id: jobId,
        session_id: null,
        body: `[Voice Memo Transcription]: ${capture.body}`,
        created_at: capture.created_at,
        updated_at: new Date().toISOString(),
      }
      setNotes([...notes, newNote])
    } else if (capture.type === 'attachment') {
      const newAttachment: Attachment = {
        id: `a_${Date.now()}`,
        job_id: jobId,
        session_id: null,
        attachment_role: 'generic',
        file_name: capture.file_url,
        file_url: capture.file_url || '',
        created_at: capture.created_at,
        updated_at: new Date().toISOString(),
      }
      setAttachments([...attachments, newAttachment])
    } else if (capture.type === 'material') {
      const qty = capture.material_quantity || 1
      const cost = capture.material_total_cost || 0
      handleAddMaterial(jobId, {
        job_id: jobId,
        session_id: null,
        description: capture.material_description || 'Material',
        quantity: qty,
        unit: capture.material_unit || 'ea',
        unit_cost: cost / qty,
        total_cost: cost,
        purchase_date: new Date().toISOString().split('T')[0],
      })
    }
    // Touch parent job updated_at for all capture types
    touchJobUpdatedAt(jobId)
    setInboxCaptures(inboxCaptures.filter((c) => c.id !== captureId))
  }
  const handleDismissInboxCapture = (captureId: string) => {
    setInboxCaptures(inboxCaptures.filter((c) => c.id !== captureId))
  }
  const handleDeleteJob = (jobId: string) => {
    // Remove all associated data
    setSessions((prev) => prev.filter((s) => s.job_id !== jobId))
    setMaterials((prev) => prev.filter((m) => m.job_id !== jobId))
    setNotes((prev) => prev.filter((n) => n.job_id !== jobId))
    setAttachments((prev) => prev.filter((a) => a.job_id !== jobId))
    // Remove the job itself
    setJobs((prev) => prev.filter((j) => j.id !== jobId))
    // Navigate back
    setCurrentScreen(previousScreen)
    setSelectedJobId(undefined)
  }
  const handleEndSession = () => {
    if (!activeSession) return
    const now = new Date().toISOString()
    const newSession: Session = {
      id: activeSession.sessionId,
      job_id: activeSession.jobId,
      entry_mode: 'live',
      session_status: 'ended',
      started_at: activeSession.startedAt,
      ended_at: now,
      discarded_at: null,
      created_at: activeSession.startedAt,
      updated_at: now,
    }
    setSessions((prev) => [...prev, newSession])
    // Update the job's updated_at so it appears in "Jump Back In"
    setJobs((prev) =>
      prev.map((j) =>
        j.id === activeSession.jobId
          ? {
              ...j,
              updated_at: now,
            }
          : j,
      ),
    )
    setActiveSession(null)
  }
  const handleQuickAction = (action: string) => {
    if (!activeSession) return
    if (action === 'note_save') {
      // Handled inline in ActiveSession, just need to mock save here
      alert('Note saved to session!')
      return
    }
    if (action === 'material_save') {
      // Handled inline in ActiveSession, just need to mock save here
      alert('Material saved to session!')
      return
    }
    setActiveSession({
      ...activeSession,
      isExpanded: false,
    })
    if (action === 'material' || action === 'note') {
      // Navigate to job detail — the inline forms will be triggered there
      handleNavigate('jobDetail', activeSession.jobId)
    } else {
      alert('Coming soon!')
    }
  }
  const renderScreen = (screenToRender: Screen) => {
    switch (screenToRender) {
      case 'home':
        return (
          <HomeDashboard
            jobs={jobRollups}
            inboxCount={inboxCaptures.length}
            onNavigate={handleNavigate}
            onOpenQuickCapture={() => setIsQuickCaptureOpen(true)}
          />
        )
      case 'jobs':
        return (
          <JobList
            jobs={jobRollups}
            inboxCount={inboxCaptures.length}
            onNavigate={handleNavigate}
            onCreateJob={handleCreateJobAndOpenDetail}
            initialFilter={jobListFilter}
          />
        )
      case 'earnings':
        return (
          <JobSummary
            jobs={jobRollups}
            onNavigate={handleNavigate}
            onViewOpenJobs={() => {
              setJobListFilter('OPEN')
              handleNavigate('jobs')
            }}
          />
        )
      case 'inbox':
        return (
          <InboxSheet
            captures={inboxCaptures}
            jobs={jobRollups}
            onBack={() => handleNavigate('home')}
            onAssign={handleAssignInboxCapture}
            onDismiss={handleDismissInboxCapture}
            onCreateJobAndAssign={handleCreateJobAndAssign}
          />
        )
      case 'profile':
        return (
          <Profile
            onBack={() => handleNavigate('home')}
            trades={userTrades}
            onUpdateTrades={setUserTrades}
          />
        )
      default:
        return (
          <HomeDashboard
            jobs={jobRollups}
            inboxCount={inboxCaptures.length}
            onNavigate={handleNavigate}
            onOpenQuickCapture={() => setIsQuickCaptureOpen(true)}
          />
        )
    }
  }
  const activeJob = jobRollups.find((j) => j.id === selectedJobId)
  return (
    <div className="min-h-screen bg-neutral-800 flex items-center justify-center p-4">
      <div className="w-[393px] h-[852px] bg-cream relative rounded-[44px] shadow-2xl overflow-hidden border border-neutral-700">
        <div className="w-full h-full overflow-y-auto overflow-x-hidden relative">
          {renderScreen(
            currentScreen === 'jobDetail' ? previousScreen : currentScreen,
          )}
        </div>

        {/* Job Detail Overlay */}
        {currentScreen === 'jobDetail' && activeJob && (
          <div className="absolute inset-0 z-[60] bg-cream">
            <JobDetail
              job={activeJob}
              onBack={() => {
                if (pendingInboxCaptureId) {
                  // User backed out without saving — delete the temp job
                  handleDeleteJob(activeJob.id)
                  setPendingInboxCaptureId(null)
                } else if (pendingNewJobId) {
                  // User cancelled new job creation — discard the temp job
                  handleDeleteJob(activeJob.id)
                  setPendingNewJobId(null)
                } else {
                  handleNavigate(previousScreen)
                }
              }}
              onUpdateWorkStatus={(status) =>
                handleUpdateWorkStatus(activeJob.id, status)
              }
              onNavigate={handleNavigate}
              onUpdateJob={(updatedFields) => {
                handleUpdateJob(updatedFields)
                // If there's a pending inbox capture, assign it now on first save
                if (pendingInboxCaptureId) {
                  handleAssignInboxCapture(
                    pendingInboxCaptureId,
                    updatedFields.id,
                  )
                  setPendingInboxCaptureId(null)
                }
                // Clear pending new job flag on first save
                if (pendingNewJobId) {
                  setPendingNewJobId(null)
                }
              }}
              onDeleteSession={handleDeleteSession}
              onUpdateSession={handleUpdateSession}
              onStartSession={handleStartSession}
              onAddPastSession={handleAddPastSession}
              userTrades={userTrades}
              onDeleteMaterial={handleDeleteMaterial}
              onUpdateMaterial={handleUpdateMaterial}
              onAddMaterial={handleAddMaterial}
              onDeleteNote={handleDeleteNote}
              onUpdateNote={handleUpdateNote}
              onAddNote={handleAddNote}
              onAddAttachment={handleAddAttachment}
              onDeleteAttachment={(attachmentId) => {
                const att = attachments.find((a) => a.id === attachmentId)
                setAttachments((prev) =>
                  prev.filter((a) => a.id !== attachmentId),
                )
                if (att?.job_id) touchJobUpdatedAt(att.job_id)
              }}
              onDeleteJob={
                pendingInboxCaptureId || pendingNewJobId
                  ? undefined
                  : handleDeleteJob
              }
              initialEditMode={initialEditMode}
              isNewJob={!!(pendingInboxCaptureId || pendingNewJobId)}
            />
          </div>
        )}

        {activeSession && (
          <ActiveSession
            session={activeSession}
            sessionNotes={notes.filter(
              (n) => n.session_id === activeSession.sessionId,
            )}
            sessionMaterials={materials.filter(
              (m) => m.session_id === activeSession.sessionId,
            )}
            onToggleExpand={() =>
              setActiveSession({
                ...activeSession,
                isExpanded: !activeSession.isExpanded,
              })
            }
            onEndSession={handleEndSession}
            onQuickAction={handleQuickAction}
            onRenameJob={handleRenameActiveSessionJob}
            onSaveNote={(body) => {
              handleAddNote(activeSession.jobId, {
                job_id: activeSession.jobId,
                session_id: activeSession.sessionId,
                body,
              })
            }}
            onSaveMaterial={(description, cost, quantity, unit) => {
              handleAddMaterial(activeSession.jobId, {
                job_id: activeSession.jobId,
                session_id: activeSession.sessionId,
                description,
                quantity,
                unit,
                unit_cost: cost,
                total_cost: quantity * cost,
                purchase_date: new Date().toISOString().split('T')[0],
              })
            }}
          />
        )}

        <QuickCaptureSheet
          isOpen={isQuickCaptureOpen}
          onClose={() => setIsQuickCaptureOpen(false)}
          jobs={jobRollups}
          onStartSession={handleStartSession}
          onQuickStartSession={handleQuickStartSession}
          onSaveQuickNote={(body) => {
            const newCapture: InboxCapture = {
              id: `ic_${Date.now()}`,
              type: 'note',
              body,
              file_url: null,
              created_at: new Date().toISOString(),
            }
            setInboxCaptures((prev) => [...prev, newCapture])
          }}
          onSaveNoteToJob={(jobId, body) => {
            handleAddNote(jobId, {
              job_id: jobId,
              session_id: null,
              body,
            })
          }}
          onSaveQuickMaterial={(material) => {
            const newCapture: InboxCapture = {
              id: `ic_${Date.now()}`,
              type: 'material',
              body: null,
              file_url: null,
              created_at: new Date().toISOString(),
              material_description: material.description,
              material_total_cost: material.totalCost,
              material_quantity: material.quantity,
              material_unit: material.unit,
            }
            setInboxCaptures((prev) => [...prev, newCapture])
          }}
          onSaveMaterialToJob={(jobId, material) => {
            handleAddMaterial(jobId, {
              job_id: jobId,
              session_id: null,
              description: material.description,
              quantity: material.quantity,
              unit: material.unit,
              unit_cost: material.totalCost / material.quantity,
              total_cost: material.totalCost,
              purchase_date: new Date().toISOString().split('T')[0],
            })
          }}
          onSaveQuickPhoto={(caption, fileName) => {
            const newCapture: InboxCapture = {
              id: `ic_${Date.now()}`,
              type: 'photo',
              body: caption || null,
              file_url: fileName,
              created_at: new Date().toISOString(),
            }
            setInboxCaptures((prev) => [...prev, newCapture])
          }}
          onSavePhotoToJob={(jobId, caption, fileName) => {
            const newAttachment: Attachment = {
              id: `a_${Date.now()}`,
              job_id: jobId,
              session_id: null,
              attachment_role: 'photo',
              file_name: fileName,
              file_url: fileName,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            }
            setAttachments((prev) => [...prev, newAttachment])
            touchJobUpdatedAt(jobId)
            if (caption) {
              handleAddNote(jobId, {
                job_id: jobId,
                session_id: null,
                body: caption,
              })
            }
          }}
          onSaveQuickVoice={(transcription) => {
            const newCapture: InboxCapture = {
              id: `ic_${Date.now()}`,
              type: 'voice_memo',
              body: transcription,
              file_url: null,
              created_at: new Date().toISOString(),
            }
            setInboxCaptures((prev) => [...prev, newCapture])
          }}
          onSaveVoiceToJob={(jobId, transcription) => {
            handleAddNote(jobId, {
              job_id: jobId,
              session_id: null,
              body: `[Voice Memo Transcription]: ${transcription}`,
            })
          }}
          onSaveQuickAttachment={(fileName) => {
            const newCapture: InboxCapture = {
              id: `ic_${Date.now()}`,
              type: 'attachment',
              body: null,
              file_url: fileName,
              created_at: new Date().toISOString(),
            }
            setInboxCaptures((prev) => [...prev, newCapture])
          }}
          onSaveAttachmentToJob={(jobId, fileName) => {
            const newAttachment: Attachment = {
              id: `a_${Date.now()}`,
              job_id: jobId,
              session_id: null,
              attachment_role: 'generic',
              file_name: fileName,
              file_url: fileName,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            }
            setAttachments((prev) => [...prev, newAttachment])
            touchJobUpdatedAt(jobId)
          }}
          onNavigate={(screen) => {
            if (screen === 'addMaterial' || screen === 'addNote') {
              handleNavigate(
                screen,
                currentScreen === 'jobDetail' ? selectedJobId : undefined,
              )
            } else {
              handleNavigate(screen)
            }
          }}
        />

        <div className="absolute bottom-0 left-0 right-0 z-50">
          <BottomNav activeTab={currentScreen} onTabChange={handleNavigate} />
        </div>
      </div>
    </div>
  )
}

```
```index.css
@import url('https://fonts.googleapis.com/css2?family=Bitter:wght@400;700&family=IBM+Plex+Mono:wght@400;500;600;700&family=IBM+Plex+Sans+Condensed:wght@400;600;700&family=IBM+Plex+Sans:wght@400;500;600;700&display=swap');

@import 'tailwindcss/base';
@import 'tailwindcss/components';
@import 'tailwindcss/utilities';

@tailwind base;
@tailwind components;
@tailwind utilities;
@layer base {
  body {
    @apply bg-neutral-800 text-navy font-mono antialiased selection:bg-field-red selection:text-white;
  }
  h1, h2, h3, h4, h5, h6 {
    @apply font-serif tracking-wide;
  }
  /* Custom Scrollbar for a cleaner look in the mobile frame */
  ::-webkit-scrollbar {
    width: 6px;
  }
  ::-webkit-scrollbar-track {
    background: transparent;
  }
  ::-webkit-scrollbar-thumb {
    @apply bg-warm-gray/30 rounded-full;
  }
}
@layer utilities {
  .tabular-nums {
    font-feature-settings: "tnum";
    font-variant-numeric: tabular-nums;
  }
  .bg-notebook-ruled {
    background-color: #FAF6F0;
    background-image:
      linear-gradient(to right, rgba(212, 87, 42, 0.15) 1px, transparent 1px),
      linear-gradient(to bottom, rgba(200, 214, 229, 0.3) 1px, transparent 1px);
    background-size: 100% 28px;
    background-position: 40px top;
    background-repeat: repeat-y, repeat;
  }
  .pb-safe {
    padding-bottom: env(safe-area-inset-bottom, 24px);
  }
}

```
```index.tsx
import React from 'react'
import './index.css'
import { render } from 'react-dom'
import { App } from './App'
render(<App />, document.getElementById('root'))

```
```src/components/ActiveSession.tsx
import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ActiveSessionState, Note, MaterialEntry } from '../types'
import {
  ClockIcon,
  XIcon,
  CameraIcon,
  FileTextIcon,
  MicIcon,
  WrenchIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  PencilIcon,
  CheckIcon,
} from 'lucide-react'
interface Props {
  session: ActiveSessionState
  sessionNotes: Note[]
  sessionMaterials: MaterialEntry[]
  onToggleExpand: () => void
  onEndSession: () => void
  onQuickAction: (action: string) => void
  onRenameJob: (newName: string) => void
  onSaveNote: (body: string) => void
  onSaveMaterial: (
    description: string,
    cost: number,
    quantity: number,
    unit: string,
  ) => void
}
export function ActiveSession({
  session,
  sessionNotes,
  sessionMaterials,
  onToggleExpand,
  onEndSession,
  onQuickAction,
  onRenameJob,
  onSaveNote,
  onSaveMaterial,
}: Props) {
  const [elapsed, setElapsed] = useState(0)
  const [isRenaming, setIsRenaming] = useState(false)
  const [renameValue, setRenameValue] = useState(session.jobName)
  // Inline forms
  const [showNoteForm, setShowNoteForm] = useState(false)
  const [noteBody, setNoteBody] = useState('')
  const [showMaterialForm, setShowMaterialForm] = useState(false)
  const [materialDesc, setMaterialDesc] = useState('')
  const [materialCost, setMaterialCost] = useState('')
  const [materialQty, setMaterialQty] = useState('1')
  const [materialUnit, setMaterialUnit] = useState('ea')
  useEffect(() => {
    const start = new Date(session.startedAt).getTime()
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - start) / 1000))
    }, 1000)
    return () => clearInterval(interval)
  }, [session.startedAt])
  const formatTime = (totalSeconds: number) => {
    const h = Math.floor(totalSeconds / 3600)
    const m = Math.floor((totalSeconds % 3600) / 60)
    const s = totalSeconds % 60
    if (h > 0) {
      return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
    }
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }
  const activities = [
    {
      type: 'session_started' as const,
      data: null,
      time: new Date(session.startedAt).getTime(),
    },
    ...sessionNotes.map((n) => ({
      type: 'note' as const,
      data: n,
      time: new Date(n.created_at).getTime(),
    })),
    ...sessionMaterials.map((m) => ({
      type: 'material' as const,
      data: m,
      time: new Date(m.created_at).getTime(),
    })),
  ].sort((a, b) => b.time - a.time)
  return (
    <AnimatePresence>
      {!session.isExpanded ? (
        <motion.div
          key="collapsed"
          initial={{
            y: 100,
            opacity: 0,
          }}
          animate={{
            y: 0,
            opacity: 1,
          }}
          exit={{
            y: 100,
            opacity: 0,
          }}
          onClick={onToggleExpand}
          className="absolute bottom-24 left-4 right-4 bg-navy text-white rounded-2xl p-4 shadow-xl flex items-center justify-between cursor-pointer z-40 border border-white/10"
        >
          <div className="flex items-center gap-3">
            <motion.div
              animate={{
                scale: [1, 1.2, 1],
                opacity: [1, 0.5, 1],
              }}
              transition={{
                repeat: Infinity,
                duration: 2,
              }}
              className="w-3 h-3 rounded-full bg-field-red"
            />
            <div>
              <div className="text-xs font-mono text-white/70 uppercase tracking-wider">
                Active Session
              </div>
              <div className="font-serif font-bold text-sm leading-tight truncate max-w-[150px]">
                {session.jobName}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="font-mono font-bold tabular-nums text-lg text-field-red">
              {formatTime(elapsed)}
            </div>
            <ChevronUpIcon className="w-5 h-5 text-white/50" />
          </div>
        </motion.div>
      ) : (
        <motion.div
          key="expanded"
          initial={{
            y: '100%',
          }}
          animate={{
            y: 0,
          }}
          exit={{
            y: '100%',
          }}
          transition={{
            type: 'spring',
            damping: 25,
            stiffness: 200,
          }}
          className="absolute inset-0 bg-cream z-50 flex flex-col pb-safe"
        >
          {/* Header */}
          <div className="px-5 pt-12 pb-6 bg-navy text-white relative shadow-md">
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-field-red rounded-t-[44px]"></div>
            <button
              onClick={onToggleExpand}
              className="absolute top-10 right-5 text-white/70 hover:text-white"
            >
              <ChevronDownIcon className="w-8 h-8" />
            </button>
            <div className="flex items-center gap-2 mb-2">
              <motion.div
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [1, 0.5, 1],
                }}
                transition={{
                  repeat: Infinity,
                  duration: 2,
                }}
                className="w-2.5 h-2.5 rounded-full bg-field-red"
              />
              <span className="text-xs font-mono font-bold uppercase tracking-widest text-white/70">
                Live Session
              </span>
            </div>
            {!isRenaming ? (
              <button
                onClick={() => {
                  setRenameValue(session.jobName)
                  setIsRenaming(true)
                }}
                className="flex items-center gap-2 group text-left"
              >
                <h1 className="text-2xl font-serif font-bold leading-tight pr-2">
                  {session.jobName}
                </h1>
                <PencilIcon className="w-4 h-4 text-white/40 group-hover:text-white/70 shrink-0 mt-0.5" />
              </button>
            ) : (
              <div className="flex items-center gap-2 pr-10">
                <input
                  type="text"
                  value={renameValue}
                  onChange={(e) => setRenameValue(e.target.value)}
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && renameValue.trim()) {
                      onRenameJob(renameValue.trim())
                      setIsRenaming(false)
                    } else if (e.key === 'Escape') {
                      setIsRenaming(false)
                    }
                  }}
                  className="flex-1 bg-white/10 text-white border border-white/20 rounded-lg px-3 py-1.5 font-serif font-bold text-xl focus:outline-none focus:border-white/40 placeholder:text-white/30"
                  placeholder="Job name..."
                />
                <button
                  onClick={() => {
                    if (renameValue.trim()) {
                      onRenameJob(renameValue.trim())
                      setIsRenaming(false)
                    }
                  }}
                  className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white shrink-0"
                >
                  <CheckIcon className="w-4 h-4" />
                </button>
              </div>
            )}
            <div className="mt-8 flex justify-center">
              <div className="text-7xl font-mono font-bold tabular-nums tracking-tighter text-white">
                {formatTime(elapsed)}
              </div>
            </div>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-5 space-y-8 bg-notebook-ruled">
            {/* Quick Actions */}
            <section>
              <h2 className="text-xs font-mono font-bold text-warm-gray uppercase tracking-wider mb-3">
                Quick Actions
              </h2>

              <AnimatePresence mode="wait">
                {showNoteForm ? (
                  <motion.div
                    key="note-form"
                    initial={{
                      opacity: 0,
                      height: 0,
                    }}
                    animate={{
                      opacity: 1,
                      height: 'auto',
                    }}
                    exit={{
                      opacity: 0,
                      height: 0,
                    }}
                    className="bg-white rounded-2xl border border-navy/10 p-4 shadow-sm mb-4"
                  >
                    <div className="text-xs font-mono font-bold text-navy uppercase tracking-wider mb-3 flex items-center gap-2">
                      <FileTextIcon className="w-3.5 h-3.5 text-amber-600" />
                      New Note
                    </div>
                    <textarea
                      value={noteBody}
                      onChange={(e) => setNoteBody(e.target.value)}
                      placeholder="What happened on site?"
                      rows={3}
                      autoFocus
                      className="w-full bg-cream text-navy border border-navy/10 rounded-lg px-3 py-2.5 font-mono text-sm focus:outline-none focus:border-field-red focus:ring-1 focus:ring-field-red/20 placeholder:text-warm-gray/40 resize-none mb-3"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          if (noteBody.trim()) {
                            onSaveNote(noteBody.trim())
                            setShowNoteForm(false)
                            setNoteBody('')
                          }
                        }}
                        disabled={!noteBody.trim()}
                        className="flex-1 bg-emerald-600 text-white rounded-lg py-2 text-xs font-mono font-bold uppercase tracking-wider active:scale-95 transition-all disabled:opacity-50"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setShowNoteForm(false)}
                        className="flex-1 bg-white text-navy border border-navy/10 rounded-lg py-2 text-xs font-mono font-bold uppercase tracking-wider active:scale-95 transition-all"
                      >
                        Cancel
                      </button>
                    </div>
                  </motion.div>
                ) : showMaterialForm ? (
                  <motion.div
                    key="material-form"
                    initial={{
                      opacity: 0,
                      height: 0,
                    }}
                    animate={{
                      opacity: 1,
                      height: 'auto',
                    }}
                    exit={{
                      opacity: 0,
                      height: 0,
                    }}
                    className="bg-white rounded-2xl border border-navy/10 p-4 shadow-sm mb-4"
                  >
                    <div className="text-xs font-mono font-bold text-navy uppercase tracking-wider mb-3 flex items-center gap-2">
                      <WrenchIcon className="w-3.5 h-3.5 text-emerald-600" />
                      New Material
                    </div>
                    <div className="space-y-3 mb-3">
                      <input
                        value={materialDesc}
                        onChange={(e) => setMaterialDesc(e.target.value)}
                        placeholder='e.g. Copper Pipe 1/2"'
                        autoFocus
                        className="w-full bg-cream text-navy border border-navy/10 rounded-lg px-3 py-2.5 font-mono text-sm focus:outline-none focus:border-field-red focus:ring-1 focus:ring-field-red/20 placeholder:text-warm-gray/40"
                      />
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono font-bold text-warm-gray text-sm">
                            $
                          </span>
                          <input
                            type="number"
                            value={materialCost}
                            onChange={(e) => setMaterialCost(e.target.value)}
                            placeholder="0.00"
                            step="0.01"
                            className="w-full bg-cream text-navy border border-navy/10 rounded-lg pl-7 pr-3 py-2.5 font-mono text-sm tabular-nums focus:outline-none focus:border-field-red focus:ring-1 focus:ring-field-red/20 placeholder:text-warm-gray/40"
                          />
                        </div>
                        <input
                          type="number"
                          value={materialQty}
                          onChange={(e) => setMaterialQty(e.target.value)}
                          placeholder="Qty"
                          className="w-14 bg-cream text-navy border border-navy/10 rounded-lg px-2 py-2.5 font-mono text-sm text-center focus:outline-none focus:border-field-red focus:ring-1 focus:ring-field-red/20"
                        />
                        <div className="relative">
                          <select
                            value={materialUnit}
                            onChange={(e) => setMaterialUnit(e.target.value)}
                            className="bg-cream text-navy border border-navy/10 rounded-lg px-2 py-2.5 font-mono text-sm focus:outline-none focus:border-field-red appearance-none pr-6"
                          >
                            {['ea', 'ft', 'pcs', 'kit', 'lot', 'gal', 'lb'].map(
                              (u) => (
                                <option key={u} value={u}>
                                  {u}
                                </option>
                              ),
                            )}
                          </select>
                          <div className="absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none text-warm-gray text-[10px]">
                            ▼
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          if (materialDesc) {
                            onSaveMaterial(
                              materialDesc,
                              materialCost ? parseFloat(materialCost) : 0,
                              parseFloat(materialQty) || 1,
                              materialUnit,
                            )
                            setShowMaterialForm(false)
                            setMaterialDesc('')
                            setMaterialCost('')
                            setMaterialQty('1')
                            setMaterialUnit('ea')
                          }
                        }}
                        disabled={!materialDesc}
                        className="flex-1 bg-emerald-600 text-white rounded-lg py-2 text-xs font-mono font-bold uppercase tracking-wider active:scale-95 transition-all disabled:opacity-50"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setShowMaterialForm(false)}
                        className="flex-1 bg-white text-navy border border-navy/10 rounded-lg py-2 text-xs font-mono font-bold uppercase tracking-wider active:scale-95 transition-all"
                      >
                        Cancel
                      </button>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="buttons"
                    initial={{
                      opacity: 0,
                    }}
                    animate={{
                      opacity: 1,
                    }}
                    exit={{
                      opacity: 0,
                    }}
                    className="grid grid-cols-2 gap-3"
                  >
                    <button
                      onClick={() => onQuickAction('photo')}
                      className="bg-white rounded-2xl border border-navy/10 p-4 flex flex-col items-center justify-center gap-2 shadow-sm active:scale-95 transition-all"
                    >
                      <CameraIcon className="w-6 h-6 text-blue-600" />
                      <span className="font-mono font-bold uppercase tracking-wider text-[10px] text-navy">
                        Photo
                      </span>
                    </button>
                    <button
                      onClick={() => setShowNoteForm(true)}
                      className="bg-white rounded-2xl border border-navy/10 p-4 flex flex-col items-center justify-center gap-2 shadow-sm active:scale-95 transition-all"
                    >
                      <FileTextIcon className="w-6 h-6 text-amber-600" />
                      <span className="font-mono font-bold uppercase tracking-wider text-[10px] text-navy">
                        Note
                      </span>
                    </button>
                    <button
                      onClick={() => onQuickAction('voice')}
                      className="bg-white rounded-2xl border border-navy/10 p-4 flex flex-col items-center justify-center gap-2 shadow-sm active:scale-95 transition-all"
                    >
                      <MicIcon className="w-6 h-6 text-purple-600" />
                      <span className="font-mono font-bold uppercase tracking-wider text-[10px] text-navy">
                        Voice Memo
                      </span>
                    </button>
                    <button
                      onClick={() => setShowMaterialForm(true)}
                      className="bg-white rounded-2xl border border-navy/10 p-4 flex flex-col items-center justify-center gap-2 shadow-sm active:scale-95 transition-all"
                    >
                      <WrenchIcon className="w-6 h-6 text-emerald-600" />
                      <span className="font-mono font-bold uppercase tracking-wider text-[10px] text-navy">
                        Material
                      </span>
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </section>

            {/* Activity Feed */}
            <section>
              <h2 className="text-xs font-mono font-bold text-warm-gray uppercase tracking-wider mb-3">
                Session Activity
              </h2>
              <div className="space-y-2.5">
                {activities.map((activity, index) => {
                  if (activity.type === 'session_started') {
                    return (
                      <div
                        key="session-started"
                        className="bg-white rounded-2xl border border-navy/10 p-4 shadow-sm flex items-start gap-3"
                      >
                        <div className="w-7 h-7 rounded-full bg-field-red/10 flex items-center justify-center shrink-0 mt-0.5">
                          <ClockIcon className="w-3.5 h-3.5 text-field-red" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-mono font-bold text-sm text-navy">
                            Session Started
                          </div>
                          <div className="text-[10px] font-mono text-warm-gray mt-0.5">
                            {new Date(session.startedAt).toLocaleTimeString(
                              [],
                              {
                                hour: '2-digit',
                                minute: '2-digit',
                              },
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  }
                  if (activity.type === 'note') {
                    const note = activity.data as Note
                    return (
                      <div
                        key={`note-${note.id}`}
                        className="bg-white rounded-2xl border border-navy/10 p-4 shadow-sm flex items-start gap-3"
                      >
                        <div className="w-7 h-7 rounded-full bg-amber-500/10 flex items-center justify-center shrink-0 mt-0.5">
                          <FileTextIcon className="w-3.5 h-3.5 text-amber-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-mono font-bold text-sm text-navy">
                            Note Added
                          </div>
                          <div className="font-mono text-xs text-warm-gray mt-1 leading-relaxed">
                            {note.body}
                          </div>
                          <div className="text-[10px] font-mono text-warm-gray/60 mt-1.5">
                            {new Date(note.created_at).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </div>
                        </div>
                      </div>
                    )
                  } else if (activity.type === 'material') {
                    const material = activity.data as MaterialEntry
                    return (
                      <div
                        key={`material-${material.id}`}
                        className="bg-white rounded-2xl border border-navy/10 p-4 shadow-sm flex items-start gap-3"
                      >
                        <div className="w-7 h-7 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0 mt-0.5">
                          <WrenchIcon className="w-3.5 h-3.5 text-emerald-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <div className="font-mono font-bold text-sm text-navy">
                              Material Added
                            </div>
                            <div className="font-mono font-bold text-sm text-navy">
                              ${material.total_cost.toFixed(2)}
                            </div>
                          </div>
                          <div className="font-mono text-xs text-warm-gray mt-1">
                            {material.description}
                          </div>
                          <div className="text-[10px] font-mono text-warm-gray/60 mt-1.5">
                            {new Date(material.created_at).toLocaleTimeString(
                              [],
                              {
                                hour: '2-digit',
                                minute: '2-digit',
                              },
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  }
                  return null
                })}
              </div>
            </section>
          </div>

          {/* Footer */}
          <div className="p-5 pb-24 bg-cream border-t border-navy/10">
            <button
              onClick={onEndSession}
              className="w-full bg-field-red text-white rounded-2xl py-5 text-xl font-mono font-bold tracking-wider uppercase shadow-lg shadow-field-red/20 active:scale-95 transition-all"
            >
              End Session
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

```
```src/components/BottomNav.tsx
import React from 'react'
import { HomeIcon, BriefcaseIcon, BarChartIcon } from 'lucide-react'
import { Screen } from '../types'
import { motion } from 'framer-motion'
interface Props {
  activeTab: Screen
  onTabChange: (tab: Screen) => void
}
export function BottomNav({ activeTab, onTabChange }: Props) {
  const navItems = [
    {
      id: 'home',
      icon: HomeIcon,
      label: 'HOME',
    },
    {
      id: 'jobs',
      icon: BriefcaseIcon,
      label: 'JOBS',
    },
    {
      id: 'earnings',
      icon: BarChartIcon,
      label: 'EARNINGS',
    },
  ] as const
  const getActiveId = () => {
    if (
      activeTab === 'jobDetail' ||
      activeTab === 'addMaterial' ||
      activeTab === 'addNote'
    )
      return 'jobs'
    if (activeTab === 'profile') return 'home'
    return activeTab
  }
  const currentActive = getActiveId()
  return (
    <div className="bg-cream/90 backdrop-blur-lg border-t border-navy/10 rounded-b-[44px]">
      <div className="flex justify-around items-center h-[72px] px-2 pb-2">
        {navItems.map(({ id, icon: Icon, label }) => {
          const isActive = currentActive === id
          return (
            <button
              key={id}
              onClick={() => onTabChange(id as Screen)}
              className={`relative flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors ${isActive ? 'text-field-red' : 'text-navy hover:text-navy/80'}`}
            >
              <Icon
                className={`w-6 h-6 transition-all ${isActive ? 'scale-110' : ''}`}
                strokeWidth={isActive ? 2.5 : 2}
              />
              <span
                className={`text-[10px] font-mono font-bold tracking-wider transition-all ${isActive ? 'opacity-100' : 'opacity-70'}`}
              >
                {label}
              </span>
              {isActive && (
                <motion.div
                  layoutId="bottomNavIndicator"
                  className="absolute -top-1 w-8 h-1 bg-field-red rounded-full"
                  transition={{
                    type: 'spring',
                    stiffness: 300,
                    damping: 30,
                  }}
                />
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}

```
```src/components/EarningsSummary.tsx
import React from 'react'
interface Props {
  revenue: number
  materials: number
}
export function EarningsSummary({ revenue, materials }: Props) {
  const net = revenue - materials
  const isPositive = net >= 0
  return (
    <div className="bg-white rounded-2xl border border-navy/10 p-5 shadow-sm mb-6">
      <h3 className="text-xs font-mono font-bold text-warm-gray mb-4 uppercase tracking-wider">
        Earnings Summary
      </h3>
      <div className="space-y-3 font-mono tabular-nums text-base">
        <div className="flex justify-between items-center">
          <span className="text-warm-gray font-medium">Revenue</span>
          <span className="font-semibold text-navy">${revenue.toFixed(2)}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-warm-gray font-medium">Materials</span>
          <span className="text-field-red font-semibold">
            -${materials.toFixed(2)}
          </span>
        </div>

        <div className="border-t border-navy/10 pt-4 mt-4 flex justify-between items-center font-bold text-2xl">
          <span className="font-serif tracking-wide text-navy">NET</span>
          <span className={isPositive ? 'text-emerald-600' : 'text-field-red'}>
            ${net.toFixed(2)}
          </span>
        </div>
      </div>
    </div>
  )
}

```
```src/components/InboxSheet.tsx
import React, { useState, memo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeftIcon,
  FileTextIcon,
  CameraIcon,
  MicIcon,
  WrenchIcon,
  CheckIcon,
  Trash2Icon,
} from 'lucide-react'
import { InboxCapture, JobRollup } from '../types'
interface Props {
  captures: InboxCapture[]
  jobs: JobRollup[]
  onBack: () => void
  onAssign: (captureId: string, jobId: string) => void
  onDismiss: (captureId: string) => void
  onCreateJobAndAssign?: (captureId: string) => void
}
export function InboxSheet({
  captures,
  jobs,
  onBack,
  onAssign,
  onDismiss,
  onCreateJobAndAssign,
}: Props) {
  const [assigningId, setAssigningId] = useState<string | null>(null)
  const getIcon = (type: string) => {
    switch (type) {
      case 'note':
        return <FileTextIcon className="w-5 h-5 text-amber-600" />
      case 'photo':
        return <CameraIcon className="w-5 h-5 text-blue-600" />
      case 'voice_memo':
        return <MicIcon className="w-5 h-5 text-purple-600" />
      case 'material':
        return <WrenchIcon className="w-5 h-5 text-emerald-600" />
      case 'attachment':
        return <FileTextIcon className="w-5 h-5 text-navy" />
      default:
        return <FileTextIcon className="w-5 h-5 text-warm-gray" />
    }
  }
  const getBgColor = (type: string) => {
    switch (type) {
      case 'note':
        return 'bg-amber-500/10'
      case 'photo':
        return 'bg-blue-500/10'
      case 'voice_memo':
        return 'bg-purple-500/10'
      case 'material':
        return 'bg-emerald-500/10'
      case 'attachment':
        return 'bg-navy/10'
      default:
        return 'bg-warm-gray/10'
    }
  }
  const formatTime = (isoString: string) => {
    const date = new Date(isoString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffHours / 24)
    if (diffHours < 24) {
      return `${diffHours}h ago`
    } else if (diffDays === 1) {
      return 'Yesterday'
    } else {
      return `${diffDays}d ago`
    }
  }
  return (
    <motion.div
      initial={{
        x: '100%',
      }}
      animate={{
        x: 0,
      }}
      exit={{
        x: '100%',
      }}
      transition={{
        type: 'spring',
        damping: 25,
        stiffness: 200,
      }}
      className="absolute inset-0 bg-notebook-ruled z-50 flex flex-col pb-safe"
    >
      {/* Header */}
      <div className="bg-cream px-4 pt-12 pb-4 shadow-sm relative z-10">
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-field-red rounded-t-[44px]"></div>
        <div className="flex items-center justify-between mb-2">
          <button
            onClick={onBack}
            className="flex items-center text-warm-gray hover:text-navy transition-colors"
          >
            <ArrowLeftIcon className="w-6 h-6" />
          </button>
        </div>
        <h1 className="text-2xl font-serif font-bold tracking-widest text-navy uppercase">
          Inbox
        </h1>
        <p className="text-sm font-mono text-warm-gray mt-1">
          Unsorted quick captures
        </p>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <AnimatePresence>
          {captures.length === 0 ? (
            <motion.div
              initial={{
                opacity: 0,
              }}
              animate={{
                opacity: 1,
              }}
              className="text-center py-16 text-warm-gray font-mono font-medium bg-white rounded-2xl border border-navy/10 border-dashed"
            >
              Inbox is empty. All caught up!
            </motion.div>
          ) : (
            [...captures]
              .sort(
                (a, b) =>
                  new Date(b.created_at).getTime() -
                  new Date(a.created_at).getTime(),
              )
              .map((capture) => (
                <motion.div
                  key={capture.id}
                  layout
                  initial={{
                    opacity: 0,
                    y: 20,
                  }}
                  animate={{
                    opacity: 1,
                    y: 0,
                  }}
                  exit={{
                    opacity: 0,
                    scale: 0.95,
                  }}
                  className="bg-white rounded-2xl border border-navy/10 shadow-sm overflow-hidden"
                >
                  <div className="p-4">
                    <div className="flex items-start gap-3 mb-3">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${getBgColor(capture.type)}`}
                      >
                        {getIcon(capture.type)}
                      </div>
                      <div className="flex-1 min-w-0 pt-1">
                        <div className="flex items-center justify-between mb-1">
                          <div className="font-mono font-bold text-sm text-navy capitalize">
                            {capture.type.replace('_', ' ')}
                          </div>
                          <div className="text-[10px] font-mono text-warm-gray uppercase tracking-wider">
                            {formatTime(capture.created_at)}
                          </div>
                        </div>

                        {capture.type === 'note' && (
                          <p className="font-mono text-sm text-navy leading-relaxed">
                            {capture.body}
                          </p>
                        )}

                        {capture.type === 'material' && (
                          <div className="space-y-1.5">
                            <p className="font-mono text-sm text-navy">
                              {capture.material_description || 'Material'}
                            </p>
                            <div className="flex items-center gap-3">
                              <span className="font-mono text-sm text-emerald-600 tabular-nums">
                                ${(capture.material_total_cost || 0).toFixed(2)}
                              </span>
                              <span className="font-mono text-xs text-warm-gray">
                                {capture.material_quantity || 1}{' '}
                                {capture.material_unit || 'ea'}
                              </span>
                            </div>
                          </div>
                        )}

                        {capture.type === 'voice_memo' && (
                          <div className="bg-cream rounded-lg p-3 border border-navy/5 flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center text-white shrink-0">
                              <div className="w-0 h-0 border-t-4 border-t-transparent border-l-6 border-l-white border-b-4 border-b-transparent ml-1" />
                            </div>
                            <div className="flex-1">
                              <div className="h-1.5 bg-navy/10 rounded-full w-full overflow-hidden">
                                <div className="h-full bg-purple-600/40 w-1/3" />
                              </div>
                            </div>
                            <div className="font-mono text-xs text-warm-gray">
                              0:00
                            </div>
                          </div>
                        )}

                        {capture.type === 'photo' && (
                          <div className="mt-2">
                            {capture.body && (
                              <p className="font-mono text-sm text-navy leading-relaxed mb-2">
                                {capture.body}
                              </p>
                            )}
                            <div className="rounded-xl overflow-hidden border border-navy/5 bg-navy/5 h-32 flex items-center justify-center relative">
                              <CameraIcon className="w-8 h-8 text-navy/20" />
                              <div className="absolute bottom-2 right-2 bg-black/50 backdrop-blur-md text-white text-[10px] font-mono px-2 py-1 rounded-md">
                                {capture.file_url}
                              </div>
                            </div>
                          </div>
                        )}

                        {capture.type === 'attachment' && (
                          <div className="mt-2 w-full bg-white border border-navy/10 rounded-xl p-3 flex items-center gap-3 shadow-sm">
                            <div className="w-8 h-8 rounded-lg bg-navy/5 flex items-center justify-center text-navy shrink-0">
                              <FileTextIcon className="w-4 h-4" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="font-mono font-bold text-sm text-navy truncate">
                                {capture.file_url}
                              </div>
                              <div className="font-mono text-xs text-warm-gray mt-0.5">
                                Document
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    {assigningId === capture.id ? (
                      <div className="mt-4 pt-4 border-t border-navy/5">
                        <div className="text-[10px] font-mono font-bold text-warm-gray uppercase tracking-wider mb-2">
                          Assign to Job
                        </div>
                        <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                          <button
                            onClick={() => {
                              if (onCreateJobAndAssign) {
                                onCreateJobAndAssign(capture.id)
                              }
                              setAssigningId(null)
                            }}
                            className="w-full text-left bg-field-red/5 text-field-red rounded-lg p-3 hover:bg-field-red/10 transition-colors border border-field-red/20 font-mono font-bold text-sm"
                          >
                            ＋ Create New Job
                          </button>
                          {jobs.map((job) => (
                            <button
                              key={job.id}
                              onClick={() => {
                                onAssign(capture.id, job.id)
                                setAssigningId(null)
                              }}
                              className="w-full text-left bg-cream rounded-lg p-3 hover:bg-[#F0EBE3] transition-colors border border-navy/5"
                            >
                              <div className="font-serif font-bold text-navy text-sm truncate">
                                {job.short_description || 'Untitled Job'}
                              </div>
                              <div className="text-[10px] font-mono text-warm-gray mt-0.5 truncate">
                                {job.customer_name || 'No customer'}
                              </div>
                            </button>
                          ))}
                        </div>
                        <button
                          onClick={() => setAssigningId(null)}
                          className="w-full mt-2 py-2 text-xs font-mono font-bold text-warm-gray uppercase tracking-wider"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <div className="flex gap-2 mt-2">
                        <button
                          onClick={() => setAssigningId(capture.id)}
                          className="flex-1 bg-field-red/10 text-field-red rounded-xl py-2.5 text-xs font-mono font-bold uppercase tracking-wider active:scale-95 transition-all flex items-center justify-center gap-1.5"
                        >
                          <CheckIcon className="w-3.5 h-3.5" /> Assign to Job
                        </button>
                        <button
                          onClick={() => onDismiss(capture.id)}
                          className="px-4 bg-white text-warm-gray border border-navy/10 rounded-xl py-2.5 text-xs font-mono font-bold uppercase tracking-wider active:scale-95 transition-all hover:text-field-red hover:border-field-red/30"
                        >
                          <Trash2Icon className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}

```
```src/components/JobCard.tsx
import React from 'react'
import { JobRollup } from '../types'
import { StatusBadge } from './StatusBadge'
import { motion } from 'framer-motion'
interface Props {
  job: JobRollup
  onClick: () => void
  missingFields?: string[]
  timeDisplay?: 'lastWorked' | 'lastUpdated'
}
function formatTime(minutes: number): string {
  if (minutes === 0) return '0h'
  const hours = minutes / 60
  return `${hours.toFixed(1)}h`
}
function getLastWorkedDate(job: JobRollup): string {
  const lastDate = job.last_worked_at || job.updated_at
  const date = new Date(lastDate)
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })
}
function getRelativeTime(isoDate: string): string {
  const now = Date.now()
  const then = new Date(isoDate).getTime()
  const diffMs = now - then
  const diffMins = Math.floor(diffMs / 60000)
  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  const diffHours = Math.floor(diffMins / 60)
  if (diffHours < 24) return `${diffHours}h ago`
  const diffDays = Math.floor(diffHours / 24)
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) return `${diffDays}d ago`
  return new Date(isoDate).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })
}
export function JobCard({
  job,
  onClick,
  missingFields,
  timeDisplay = 'lastWorked',
}: Props) {
  const net =
    job.estimated_profit ?? job.total_invoiced_amount - job.total_material_cost
  const hasMissing = missingFields && missingFields.length > 0
  return (
    <motion.div
      whileTap={{
        scale: 0.98,
      }}
      onClick={onClick}
      className="bg-white rounded-2xl border border-navy/10 p-5 mb-4 shadow-sm cursor-pointer hover:shadow-md transition-all relative overflow-hidden"
    >
      {/* Subtle notebook margin line */}
      <div className="absolute left-5 top-0 bottom-0 w-[2px] bg-field-red/15 pointer-events-none"></div>

      <div className="pl-6">
        <div className="flex justify-between items-start mb-3 gap-2">
          <div>
            <h3 className="font-serif font-bold text-lg leading-tight text-navy">
              {job.short_description || 'Untitled Job'}
            </h3>
            <p className="text-sm text-warm-gray font-mono mt-1">
              {job.customer_name || 'No customer'} •{' '}
              {timeDisplay === 'lastUpdated'
                ? `Updated ${getRelativeTime(job.last_activity_at)}`
                : `Last worked ${getLastWorkedDate(job)}`}
            </p>
          </div>
          <div className="shrink-0">
            <StatusBadge status={job.job_work_status} />
          </div>
        </div>

        {/* Missing fields pills */}
        {hasMissing && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {missingFields.map((field) => (
              <span
                key={field}
                className="text-[10px] font-mono font-bold bg-amber-50 text-amber-700 border border-amber-200/50 rounded-full px-2 py-0.5 uppercase tracking-wider"
              >
                {field}
              </span>
            ))}
          </div>
        )}

        {job.job_type && (
          <div className="inline-block bg-navy rounded-md text-[11px] font-mono font-bold px-2 py-1 mb-5 text-white uppercase tracking-wider">
            {job.job_type}
          </div>
        )}
        {!job.job_type && <div className="mb-5" />}

        <div className="flex justify-between items-end border-t border-navy/5 pt-4 tabular-nums text-sm">
          <div className="flex flex-col">
            <span className="text-warm-gray text-[10px] font-mono font-bold tracking-wider mb-1">
              TIME
            </span>
            <span className="font-mono font-semibold text-navy">
              {formatTime(job.total_session_minutes)}
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-warm-gray text-[10px] font-mono font-bold tracking-wider mb-1">
              REV
            </span>
            <span className="font-mono font-semibold text-navy">
              ${job.total_invoiced_amount}
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-warm-gray text-[10px] font-mono font-bold tracking-wider mb-1">
              MAT
            </span>
            <span className="font-mono font-semibold text-field-red">
              -${job.total_material_cost}
            </span>
          </div>
          <div className="flex flex-col text-right">
            <span className="text-warm-gray text-[10px] font-mono font-bold tracking-wider mb-1">
              NET
            </span>
            <span
              className={`font-mono font-bold text-lg leading-none ${net >= 0 ? 'text-emerald-600' : 'text-field-red'}`}
            >
              ${net}
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

```
```src/components/QuickCaptureSheet.tsx
import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence, useDragControls } from 'framer-motion'
import {
  ClockIcon,
  MicIcon,
  FileTextIcon,
  CameraIcon,
  PlayIcon,
  ArrowLeftIcon,
  WrenchIcon,
  PlusIcon,
  SendIcon,
  CheckIcon,
} from 'lucide-react'
import { Screen, JobRollup } from '../types'
interface Props {
  isOpen: boolean
  onClose: () => void
  onNavigate: (screen: Screen) => void
  onStartSession: (jobId: string) => void
  onQuickStartSession: () => void
  onSaveQuickNote: (body: string) => void
  onSaveNoteToJob: (jobId: string, body: string) => void
  onSaveQuickMaterial: (material: {
    description: string
    totalCost: number
    quantity: number
    unit: string
  }) => void
  onSaveMaterialToJob: (
    jobId: string,
    material: {
      description: string
      totalCost: number
      quantity: number
      unit: string
    },
  ) => void
  onSaveQuickPhoto: (caption: string, fileName: string) => void
  onSavePhotoToJob: (jobId: string, caption: string, fileName: string) => void
  onSaveQuickVoice: (transcription: string) => void
  onSaveVoiceToJob: (jobId: string, transcription: string) => void
  onSaveQuickAttachment: (fileName: string) => void
  onSaveAttachmentToJob: (jobId: string, fileName: string) => void
  jobs: JobRollup[]
}
export function QuickCaptureSheet({
  isOpen,
  onClose,
  onNavigate,
  onStartSession,
  onQuickStartSession,
  onSaveQuickNote,
  onSaveNoteToJob,
  onSaveQuickMaterial,
  onSaveMaterialToJob,
  onSaveQuickPhoto,
  onSavePhotoToJob,
  onSaveQuickVoice,
  onSaveVoiceToJob,
  onSaveQuickAttachment,
  onSaveAttachmentToJob,
  jobs,
}: Props) {
  const [showJobSelect, setShowJobSelect] = useState(false)
  const [selectedAction, setSelectedAction] = useState<string | null>(null)
  const [noteBody, setNoteBody] = useState('')
  const [noteDestination, setNoteDestination] = useState<
    | {
        type: 'inbox'
      }
    | {
        type: 'job'
        jobId: string
        jobName: string
      }
    | null
  >(null)
  // Material form state
  const [materialDesc, setMaterialDesc] = useState('')
  const [materialCost, setMaterialCost] = useState('')
  const [materialQty, setMaterialQty] = useState('1')
  const [materialUnit, setMaterialUnit] = useState('ea')
  const [materialDestination, setMaterialDestination] = useState<
    | {
        type: 'inbox'
      }
    | {
        type: 'job'
        jobId: string
        jobName: string
      }
    | null
  >(null)
  // Photo form state
  const [photoCaption, setPhotoCaption] = useState('')
  const [photoFileName, setPhotoFileName] = useState('')
  const [photoDestination, setPhotoDestination] = useState<
    | {
        type: 'inbox'
      }
    | {
        type: 'job'
        jobId: string
        jobName: string
      }
    | null
  >(null)
  // Voice form state
  const [voiceTranscription, setVoiceTranscription] = useState('')
  const [voiceDestination, setVoiceDestination] = useState<
    | {
        type: 'inbox'
      }
    | {
        type: 'job'
        jobId: string
        jobName: string
      }
    | null
  >(null)
  // Attachment form state
  const [attachmentFileName, setAttachmentFileName] = useState('')
  const [attachmentDestination, setAttachmentDestination] = useState<
    | {
        type: 'inbox'
      }
    | {
        type: 'job'
        jobId: string
        jobName: string
      }
    | null
  >(null)
  const handleAction = (action: string) => {
    setSelectedAction(action)
    setShowJobSelect(true)
  }
  const handleJobSelect = (jobId: string) => {
    if (selectedAction === 'timer') {
      onStartSession(jobId)
      setShowJobSelect(false)
      onClose()
    } else if (selectedAction === 'note') {
      const job = jobs.find((j) => j.id === jobId)
      setNoteDestination({
        type: 'job',
        jobId,
        jobName: job?.short_description || 'Untitled Job',
      })
    } else if (selectedAction === 'material') {
      const job = jobs.find((j) => j.id === jobId)
      setMaterialDestination({
        type: 'job',
        jobId,
        jobName: job?.short_description || 'Untitled Job',
      })
    } else if (selectedAction === 'photo') {
      const job = jobs.find((j) => j.id === jobId)
      setPhotoDestination({
        type: 'job',
        jobId,
        jobName: job?.short_description || 'Untitled Job',
      })
    } else if (selectedAction === 'voice') {
      const job = jobs.find((j) => j.id === jobId)
      setVoiceDestination({
        type: 'job',
        jobId,
        jobName: job?.short_description || 'Untitled Job',
      })
    } else if (selectedAction === 'attachment') {
      const job = jobs.find((j) => j.id === jobId)
      setAttachmentDestination({
        type: 'job',
        jobId,
        jobName: job?.short_description || 'Untitled Job',
      })
    } else {
      onNavigate('jobDetail' as Screen)
      setShowJobSelect(false)
      onClose()
    }
  }
  const handleQuickStart = () => {
    if (selectedAction === 'timer') {
      onQuickStartSession()
      setShowJobSelect(false)
      onClose()
    } else if (selectedAction === 'note') {
      setNoteDestination({
        type: 'inbox',
      })
    } else if (selectedAction === 'material') {
      setMaterialDestination({
        type: 'inbox',
      })
    } else if (selectedAction === 'photo') {
      setPhotoDestination({
        type: 'inbox',
      })
    } else if (selectedAction === 'voice') {
      setVoiceDestination({
        type: 'inbox',
      })
    } else if (selectedAction === 'attachment') {
      setAttachmentDestination({
        type: 'inbox',
      })
    } else {
      alert('Creates new job and opens inline form (Coming soon)')
      setShowJobSelect(false)
      onClose()
    }
  }
  const handleSaveNote = () => {
    if (!noteBody.trim() || !noteDestination) return
    if (noteDestination.type === 'inbox') {
      onSaveQuickNote(noteBody.trim())
    } else {
      onSaveNoteToJob(noteDestination.jobId, noteBody.trim())
    }
    setNoteBody('')
    setNoteDestination(null)
    setShowJobSelect(false)
    onClose()
  }
  const handleSaveMaterial = () => {
    if (!materialDesc.trim() || !materialDestination) return
    const material = {
      description: materialDesc.trim(),
      totalCost: materialCost ? parseFloat(materialCost) : 0,
      quantity: parseFloat(materialQty) || 1,
      unit: materialUnit,
    }
    if (materialDestination.type === 'inbox') {
      onSaveQuickMaterial(material)
    } else {
      onSaveMaterialToJob(materialDestination.jobId, material)
    }
    setMaterialDesc('')
    setMaterialCost('')
    setMaterialQty('1')
    setMaterialUnit('ea')
    setMaterialDestination(null)
    setShowJobSelect(false)
    onClose()
  }
  const handleSavePhoto = () => {
    if (!photoFileName || !photoDestination) return
    if (photoDestination.type === 'inbox') {
      onSaveQuickPhoto(photoCaption.trim(), photoFileName)
    } else {
      onSavePhotoToJob(
        photoDestination.jobId,
        photoCaption.trim(),
        photoFileName,
      )
    }
    setPhotoCaption('')
    setPhotoFileName('')
    setPhotoDestination(null)
    setShowJobSelect(false)
    onClose()
  }
  const handleSaveVoice = () => {
    if (!voiceTranscription.trim() || !voiceDestination) return
    if (voiceDestination.type === 'inbox') {
      onSaveQuickVoice(voiceTranscription.trim())
    } else {
      onSaveVoiceToJob(voiceDestination.jobId, voiceTranscription.trim())
    }
    setVoiceTranscription('')
    setVoiceDestination(null)
    setShowJobSelect(false)
    onClose()
  }
  const handleSaveAttachment = () => {
    if (!attachmentFileName || !attachmentDestination) return
    if (attachmentDestination.type === 'inbox') {
      onSaveQuickAttachment(attachmentFileName)
    } else {
      onSaveAttachmentToJob(attachmentDestination.jobId, attachmentFileName)
    }
    setAttachmentFileName('')
    setAttachmentDestination(null)
    setShowJobSelect(false)
    onClose()
  }
  // Reset state when closed
  useEffect(() => {
    if (!isOpen) {
      setShowJobSelect(false)
      setNoteBody('')
      setNoteDestination(null)
      setMaterialDesc('')
      setMaterialCost('')
      setMaterialQty('1')
      setMaterialUnit('ea')
      setMaterialDestination(null)
      setPhotoCaption('')
      setPhotoFileName('')
      setPhotoDestination(null)
      setVoiceTranscription('')
      setVoiceDestination(null)
      setAttachmentFileName('')
      setAttachmentDestination(null)
    }
  }, [isOpen])
  const dragControls = useDragControls()
  // Determine which view to show
  const showNoteEditor = selectedAction === 'note' && noteDestination !== null
  const showMaterialEditor =
    selectedAction === 'material' && materialDestination !== null
  const showPhotoEditor =
    selectedAction === 'photo' && photoDestination !== null
  const showVoiceEditor =
    selectedAction === 'voice' && voiceDestination !== null
  const showAttachmentEditor =
    selectedAction === 'attachment' && attachmentDestination !== null
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{
              opacity: 0,
            }}
            animate={{
              opacity: 1,
            }}
            exit={{
              opacity: 0,
            }}
            onClick={onClose}
            className="absolute inset-0 bg-navy/40 backdrop-blur-sm z-[60]"
          />

          <motion.div
            initial={{
              y: '100%',
            }}
            animate={{
              y: 0,
            }}
            exit={{
              y: '100%',
            }}
            transition={{
              type: 'spring',
              damping: 25,
              stiffness: 200,
            }}
            className="absolute bottom-0 left-0 right-0 bg-cream rounded-t-[32px] z-[70] shadow-2xl border-t border-navy/10 pb-safe"
          >
            <div className="p-6">
              <div className="w-10 h-1.5 bg-navy/20 rounded-full mx-auto mb-8" />

              {/* Screen 1: Quick Actions Grid */}
              {!showJobSelect ? (
                <>
                  <h2 className="text-xl font-serif font-bold text-navy mb-6 text-center">
                    Quick Capture
                  </h2>
                  <div className="grid grid-cols-3 gap-3">
                    <button
                      onClick={() => handleAction('timer')}
                      className="bg-white rounded-2xl border border-navy/10 p-4 flex flex-col items-center justify-center gap-2 shadow-sm active:scale-95 transition-all"
                    >
                      <div className="w-10 h-10 rounded-full bg-field-red/10 flex items-center justify-center text-field-red">
                        <ClockIcon className="w-5 h-5" strokeWidth={2.5} />
                      </div>
                      <span className="font-mono font-bold uppercase tracking-wider text-[10px] text-navy text-center">
                        Start
                        <br />
                        Session
                      </span>
                    </button>
                    <button
                      onClick={() => handleAction('note')}
                      className="bg-white rounded-2xl border border-navy/10 p-4 flex flex-col items-center justify-center gap-2 shadow-sm active:scale-95 transition-all"
                    >
                      <div className="w-10 h-10 rounded-full bg-amber-600/10 flex items-center justify-center text-amber-600">
                        <FileTextIcon className="w-5 h-5" strokeWidth={2.5} />
                      </div>
                      <span className="font-mono font-bold uppercase tracking-wider text-[10px] text-navy text-center">
                        New
                        <br />
                        Note
                      </span>
                    </button>
                    <button
                      onClick={() => handleAction('photo')}
                      className="bg-white rounded-2xl border border-navy/10 p-4 flex flex-col items-center justify-center gap-2 shadow-sm active:scale-95 transition-all"
                    >
                      <div className="w-10 h-10 rounded-full bg-blue-600/10 flex items-center justify-center text-blue-600">
                        <CameraIcon className="w-5 h-5" strokeWidth={2.5} />
                      </div>
                      <span className="font-mono font-bold uppercase tracking-wider text-[10px] text-navy text-center">
                        Add
                        <br />
                        Photo
                      </span>
                    </button>
                    <button
                      onClick={() => handleAction('voice')}
                      className="bg-white rounded-2xl border border-navy/10 p-4 flex flex-col items-center justify-center gap-2 shadow-sm active:scale-95 transition-all"
                    >
                      <div className="w-10 h-10 rounded-full bg-purple-600/10 flex items-center justify-center text-purple-600">
                        <MicIcon className="w-5 h-5" strokeWidth={2.5} />
                      </div>
                      <span className="font-mono font-bold uppercase tracking-wider text-[10px] text-navy text-center">
                        Voice
                        <br />
                        Memo
                      </span>
                    </button>
                    <button
                      onClick={() => handleAction('attachment')}
                      className="bg-white rounded-2xl border border-navy/10 p-4 flex flex-col items-center justify-center gap-2 shadow-sm active:scale-95 transition-all"
                    >
                      <div className="w-10 h-10 rounded-full bg-warm-gray/10 flex items-center justify-center text-warm-gray">
                        <FileTextIcon className="w-5 h-5" strokeWidth={2.5} />
                      </div>
                      <span className="font-mono font-bold uppercase tracking-wider text-[10px] text-navy text-center">
                        Upload
                        <br />
                        File
                      </span>
                    </button>
                    <button
                      onClick={() => handleAction('material')}
                      className="bg-white rounded-2xl border border-navy/10 p-4 flex flex-col items-center justify-center gap-2 shadow-sm active:scale-95 transition-all"
                    >
                      <div className="w-10 h-10 rounded-full bg-emerald-600/10 flex items-center justify-center text-emerald-600">
                        <WrenchIcon className="w-5 h-5" strokeWidth={2.5} />
                      </div>
                      <span className="font-mono font-bold uppercase tracking-wider text-[10px] text-navy text-center">
                        New
                        <br />
                        Material
                      </span>
                    </button>
                  </div>
                </>
              ) : showNoteEditor ? (
                <motion.div
                  initial={{
                    opacity: 0,
                    x: 20,
                  }}
                  animate={{
                    opacity: 1,
                    x: 0,
                  }}
                >
                  <button
                    onClick={() => setNoteDestination(null)}
                    className="flex items-center text-warm-gray mb-4"
                  >
                    <ArrowLeftIcon className="w-5 h-5 mr-1" />
                    <span className="text-sm font-mono font-bold uppercase tracking-wider">
                      Back
                    </span>
                  </button>

                  <div className="flex items-center gap-2 mb-2">
                    <FileTextIcon className="w-4 h-4 text-amber-600" />
                    <h2 className="text-lg font-serif font-bold text-navy">
                      New Note
                    </h2>
                  </div>
                  <div className="text-xs font-mono text-warm-gray mb-5">
                    {noteDestination.type === 'inbox'
                      ? 'Saving to inbox — assign to a job later'
                      : `Attaching to ${noteDestination.jobName}`}
                  </div>

                  <textarea
                    value={noteBody}
                    onChange={(e) => setNoteBody(e.target.value)}
                    placeholder="What happened on site? Measurements, observations, next steps..."
                    rows={6}
                    autoFocus
                    className="w-full bg-white text-navy border border-navy/10 rounded-xl px-4 py-3 font-mono text-sm leading-relaxed focus:outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-600/15 placeholder:text-warm-gray/40 resize-none shadow-sm mb-4"
                  />

                  <button
                    onClick={handleSaveNote}
                    disabled={!noteBody.trim()}
                    className="w-full bg-amber-600 text-white rounded-xl py-4 text-sm font-mono font-bold uppercase tracking-wider active:scale-[0.98] transition-all disabled:opacity-40 flex items-center justify-center gap-2 shadow-lg shadow-amber-600/20"
                  >
                    <SendIcon className="w-4 h-4" />
                    {noteDestination.type === 'inbox'
                      ? 'Save to Inbox'
                      : 'Save Note'}
                  </button>
                </motion.div>
              ) : showMaterialEditor ? (
                <motion.div
                  initial={{
                    opacity: 0,
                    x: 20,
                  }}
                  animate={{
                    opacity: 1,
                    x: 0,
                  }}
                >
                  <button
                    onClick={() => setMaterialDestination(null)}
                    className="flex items-center text-warm-gray mb-4"
                  >
                    <ArrowLeftIcon className="w-5 h-5 mr-1" />
                    <span className="text-sm font-mono font-bold uppercase tracking-wider">
                      Back
                    </span>
                  </button>

                  <div className="flex items-center gap-2 mb-2">
                    <WrenchIcon className="w-4 h-4 text-emerald-600" />
                    <h2 className="text-lg font-serif font-bold text-navy">
                      New Material
                    </h2>
                  </div>
                  <div className="text-xs font-mono text-warm-gray mb-5">
                    {materialDestination.type === 'inbox'
                      ? 'Saving to inbox — assign to a job later'
                      : `Attaching to ${materialDestination.jobName}`}
                  </div>

                  <div className="space-y-3 mb-4">
                    {/* Description */}
                    <input
                      value={materialDesc}
                      onChange={(e) => setMaterialDesc(e.target.value)}
                      placeholder='e.g. Copper Pipe 1/2"'
                      autoFocus
                      className="w-full bg-white text-navy border border-navy/10 rounded-xl px-4 py-3 font-mono text-sm focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/15 placeholder:text-warm-gray/40 shadow-sm"
                    />

                    {/* Cost & Qty Row */}
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 font-mono font-bold text-warm-gray">
                          $
                        </span>
                        <input
                          type="number"
                          value={materialCost}
                          onChange={(e) => setMaterialCost(e.target.value)}
                          placeholder="0.00"
                          step="0.01"
                          className="w-full bg-white text-navy border border-navy/10 rounded-xl pl-8 pr-3 py-3 font-mono text-sm tabular-nums focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/15 placeholder:text-warm-gray/40 shadow-sm"
                        />
                      </div>
                      <input
                        type="number"
                        value={materialQty}
                        onChange={(e) => setMaterialQty(e.target.value)}
                        placeholder="Qty"
                        className="w-16 bg-white text-navy border border-navy/10 rounded-xl px-3 py-3 font-mono text-sm text-center focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/15 shadow-sm"
                      />
                      <div className="relative">
                        <select
                          value={materialUnit}
                          onChange={(e) => setMaterialUnit(e.target.value)}
                          className="bg-white text-navy border border-navy/10 rounded-xl px-3 py-3 font-mono text-sm focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/15 appearance-none pr-7 shadow-sm"
                        >
                          {['ea', 'ft', 'pcs', 'kit', 'lot', 'gal', 'lb'].map(
                            (u) => (
                              <option key={u} value={u}>
                                {u}
                              </option>
                            ),
                          )}
                        </select>
                        <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-warm-gray text-xs">
                          ▼
                        </div>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={handleSaveMaterial}
                    disabled={!materialDesc.trim()}
                    className="w-full bg-emerald-600 text-white rounded-xl py-4 text-sm font-mono font-bold uppercase tracking-wider active:scale-[0.98] transition-all disabled:opacity-40 flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20"
                  >
                    <CheckIcon className="w-4 h-4" />
                    {materialDestination.type === 'inbox'
                      ? 'Save to Inbox'
                      : 'Save Material'}
                  </button>
                </motion.div>
              ) : showPhotoEditor ? (
                <motion.div
                  initial={{
                    opacity: 0,
                    x: 20,
                  }}
                  animate={{
                    opacity: 1,
                    x: 0,
                  }}
                >
                  <button
                    onClick={() => setPhotoDestination(null)}
                    className="flex items-center text-warm-gray mb-4"
                  >
                    <ArrowLeftIcon className="w-5 h-5 mr-1" />
                    <span className="text-sm font-mono font-bold uppercase tracking-wider">
                      Back
                    </span>
                  </button>

                  <div className="flex items-center gap-2 mb-2">
                    <CameraIcon className="w-4 h-4 text-blue-600" />
                    <h2 className="text-lg font-serif font-bold text-navy">
                      New Photo
                    </h2>
                  </div>
                  <div className="text-xs font-mono text-warm-gray mb-5">
                    {photoDestination.type === 'inbox'
                      ? 'Saving to inbox — assign to a job later'
                      : `Attaching to ${photoDestination.jobName}`}
                  </div>

                  <div className="space-y-4 mb-4">
                    {!photoFileName ? (
                      <button
                        onClick={() =>
                          setPhotoFileName(
                            `IMG_${Math.floor(Math.random() * 10000)}.jpg`,
                          )
                        }
                        className="w-full h-32 bg-blue-500/5 border-2 border-dashed border-blue-500/20 rounded-xl flex flex-col items-center justify-center gap-2 text-blue-600 hover:bg-blue-500/10 transition-colors"
                      >
                        <CameraIcon className="w-6 h-6" />
                        <span className="font-mono text-sm font-bold">
                          Tap to take photo
                        </span>
                      </button>
                    ) : (
                      <div className="w-full h-32 bg-navy/5 border border-navy/10 rounded-xl flex items-center justify-center relative overflow-hidden">
                        <CameraIcon className="w-8 h-8 text-navy/20" />
                        <div className="absolute bottom-2 right-2 bg-black/50 backdrop-blur-md text-white text-[10px] font-mono px-2 py-1 rounded-md">
                          {photoFileName}
                        </div>
                        <button
                          onClick={() => setPhotoFileName('')}
                          className="absolute top-2 right-2 w-6 h-6 bg-black/50 rounded-full flex items-center justify-center text-white"
                        >
                          ×
                        </button>
                      </div>
                    )}

                    <input
                      value={photoCaption}
                      onChange={(e) => setPhotoCaption(e.target.value)}
                      placeholder="Add a caption (optional)"
                      className="w-full bg-white text-navy border border-navy/10 rounded-xl px-4 py-3 font-mono text-sm focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/15 placeholder:text-warm-gray/40 shadow-sm"
                    />
                  </div>

                  <button
                    onClick={handleSavePhoto}
                    disabled={!photoFileName}
                    className="w-full bg-blue-600 text-white rounded-xl py-4 text-sm font-mono font-bold uppercase tracking-wider active:scale-[0.98] transition-all disabled:opacity-40 flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20"
                  >
                    <CheckIcon className="w-4 h-4" />
                    {photoDestination.type === 'inbox'
                      ? 'Save to Inbox'
                      : 'Save Photo'}
                  </button>
                </motion.div>
              ) : showVoiceEditor ? (
                <motion.div
                  initial={{
                    opacity: 0,
                    x: 20,
                  }}
                  animate={{
                    opacity: 1,
                    x: 0,
                  }}
                >
                  <button
                    onClick={() => setVoiceDestination(null)}
                    className="flex items-center text-warm-gray mb-4"
                  >
                    <ArrowLeftIcon className="w-5 h-5 mr-1" />
                    <span className="text-sm font-mono font-bold uppercase tracking-wider">
                      Back
                    </span>
                  </button>

                  <div className="flex items-center gap-2 mb-2">
                    <MicIcon className="w-4 h-4 text-purple-600" />
                    <h2 className="text-lg font-serif font-bold text-navy">
                      New Voice Memo
                    </h2>
                  </div>
                  <div className="text-xs font-mono text-warm-gray mb-5">
                    {voiceDestination.type === 'inbox'
                      ? 'Saving to inbox — assign to a job later'
                      : `Attaching to ${voiceDestination.jobName}`}
                  </div>

                  <div className="space-y-4 mb-4">
                    {!voiceTranscription ? (
                      <button
                        onClick={() =>
                          setVoiceTranscription(
                            'Need to pick up more 1/2 inch PVC pipe for the sink repair. Also noticed a small leak near the main valve that we should quote them for.',
                          )
                        }
                        className="w-full py-8 bg-purple-600/5 border-2 border-dashed border-purple-600/20 rounded-xl flex flex-col items-center justify-center gap-3 text-purple-600 hover:bg-purple-600/10 transition-colors"
                      >
                        <div className="w-12 h-12 rounded-full bg-purple-600 text-white flex items-center justify-center shadow-lg shadow-purple-600/20">
                          <MicIcon className="w-6 h-6" />
                        </div>
                        <span className="font-mono text-sm font-bold">
                          Tap to record
                        </span>
                      </button>
                    ) : (
                      <div className="space-y-3">
                        <div className="bg-cream rounded-xl p-3 border border-navy/5 flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center text-white shrink-0">
                            <PlayIcon className="w-4 h-4 ml-0.5" />
                          </div>
                          <div className="flex-1">
                            <div className="h-1.5 bg-navy/10 rounded-full w-full overflow-hidden">
                              <div className="h-full bg-purple-600 w-full" />
                            </div>
                          </div>
                          <div className="font-mono text-xs text-warm-gray">
                            0:12
                          </div>
                        </div>
                        <textarea
                          value={voiceTranscription}
                          onChange={(e) =>
                            setVoiceTranscription(e.target.value)
                          }
                          placeholder="Transcription..."
                          rows={4}
                          className="w-full bg-white text-navy border border-navy/10 rounded-xl px-4 py-3 font-mono text-sm leading-relaxed focus:outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-600/15 placeholder:text-warm-gray/40 resize-none shadow-sm"
                        />
                      </div>
                    )}
                  </div>

                  <button
                    onClick={handleSaveVoice}
                    disabled={!voiceTranscription.trim()}
                    className="w-full bg-purple-600 text-white rounded-xl py-4 text-sm font-mono font-bold uppercase tracking-wider active:scale-[0.98] transition-all disabled:opacity-40 flex items-center justify-center gap-2 shadow-lg shadow-purple-600/20"
                  >
                    <CheckIcon className="w-4 h-4" />
                    {voiceDestination.type === 'inbox'
                      ? 'Save to Inbox'
                      : 'Save Voice Memo'}
                  </button>
                </motion.div>
              ) : showAttachmentEditor ? (
                <motion.div
                  initial={{
                    opacity: 0,
                    x: 20,
                  }}
                  animate={{
                    opacity: 1,
                    x: 0,
                  }}
                >
                  <button
                    onClick={() => setAttachmentDestination(null)}
                    className="flex items-center text-warm-gray mb-4"
                  >
                    <ArrowLeftIcon className="w-5 h-5 mr-1" />
                    <span className="text-sm font-mono font-bold uppercase tracking-wider">
                      Back
                    </span>
                  </button>

                  <div className="flex items-center gap-2 mb-2">
                    <FileTextIcon className="w-4 h-4 text-warm-gray" />
                    <h2 className="text-lg font-serif font-bold text-navy">
                      Upload File
                    </h2>
                  </div>
                  <div className="text-xs font-mono text-warm-gray mb-5">
                    {attachmentDestination.type === 'inbox'
                      ? 'Saving to inbox — assign to a job later'
                      : `Attaching to ${attachmentDestination.jobName}`}
                  </div>

                  <div className="space-y-4 mb-4">
                    {!attachmentFileName ? (
                      <button
                        onClick={() =>
                          setAttachmentFileName(
                            `document_${Math.floor(Math.random() * 1000)}.pdf`,
                          )
                        }
                        className="w-full h-32 bg-warm-gray/5 border-2 border-dashed border-warm-gray/20 rounded-xl flex flex-col items-center justify-center gap-2 text-warm-gray hover:bg-warm-gray/10 transition-colors"
                      >
                        <PlusIcon className="w-6 h-6" />
                        <span className="font-mono text-sm font-bold">
                          Select File
                        </span>
                      </button>
                    ) : (
                      <div className="w-full bg-white border border-navy/10 rounded-xl p-4 flex items-center gap-3 shadow-sm">
                        <div className="w-10 h-10 rounded-lg bg-warm-gray/10 flex items-center justify-center text-warm-gray shrink-0">
                          <FileTextIcon className="w-5 h-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-mono font-bold text-sm text-navy truncate">
                            {attachmentFileName}
                          </div>
                          <div className="font-mono text-xs text-warm-gray mt-0.5">
                            1.2 MB · PDF
                          </div>
                        </div>
                        <button
                          onClick={() => setAttachmentFileName('')}
                          className="w-8 h-8 rounded-full bg-navy/5 flex items-center justify-center text-warm-gray hover:text-field-red hover:bg-field-red/10 transition-colors"
                        >
                          ×
                        </button>
                      </div>
                    )}
                  </div>

                  <button
                    onClick={handleSaveAttachment}
                    disabled={!attachmentFileName}
                    className="w-full bg-navy text-white rounded-xl py-4 text-sm font-mono font-bold uppercase tracking-wider active:scale-[0.98] transition-all disabled:opacity-40 flex items-center justify-center gap-2 shadow-lg shadow-navy/20"
                  >
                    <CheckIcon className="w-4 h-4" />
                    {attachmentDestination.type === 'inbox'
                      ? 'Save to Inbox'
                      : 'Save File'}
                  </button>
                </motion.div>
              ) : (
                <motion.div
                  initial={{
                    opacity: 0,
                    x: 20,
                  }}
                  animate={{
                    opacity: 1,
                    x: 0,
                  }}
                >
                  <button
                    onClick={() => setShowJobSelect(false)}
                    className="flex items-center text-warm-gray mb-4"
                  >
                    <ArrowLeftIcon className="w-5 h-5 mr-1" />
                    <span className="text-sm font-mono font-bold uppercase tracking-wider">
                      Back
                    </span>
                  </button>
                  <h2 className="text-xl font-serif font-bold text-navy mb-6 text-center capitalize">
                    {selectedAction === 'timer'
                      ? 'Start Session'
                      : selectedAction === 'note'
                        ? 'New Note'
                        : selectedAction === 'material'
                          ? 'New Material'
                          : `Add ${selectedAction}`}
                  </h2>
                  <div className="space-y-2 max-h-[50vh] overflow-y-auto">
                    {/* Primary action card */}
                    <button
                      onClick={handleQuickStart}
                      className={`w-full text-left rounded-xl p-4 flex items-center gap-3 shadow-lg active:scale-[0.98] transition-all ${selectedAction === 'note' ? 'bg-amber-600 text-white shadow-amber-600/20' : selectedAction === 'material' ? 'bg-emerald-600 text-white shadow-emerald-600/20' : 'bg-field-red text-white shadow-field-red/20'}`}
                    >
                      <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                        {selectedAction === 'timer' ? (
                          <PlayIcon
                            className="w-5 h-5 ml-0.5"
                            strokeWidth={2.5}
                          />
                        ) : selectedAction === 'note' ? (
                          <FileTextIcon className="w-5 h-5" strokeWidth={2.5} />
                        ) : selectedAction === 'material' ? (
                          <WrenchIcon className="w-5 h-5" strokeWidth={2.5} />
                        ) : (
                          <PlusIcon className="w-5 h-5" strokeWidth={2.5} />
                        )}
                      </div>
                      <div>
                        <div className="font-mono font-bold uppercase tracking-wider text-sm">
                          {selectedAction === 'timer'
                            ? 'Start New Session'
                            : selectedAction === 'note'
                              ? 'Create Quick Note'
                              : selectedAction === 'material'
                                ? 'Log Quick Material'
                                : selectedAction === 'photo'
                                  ? 'Save Quick Photo'
                                  : selectedAction === 'voice'
                                    ? 'Save Quick Voice Memo'
                                    : selectedAction === 'attachment'
                                      ? 'Save Quick File'
                                      : 'Create New Job'}
                        </div>
                        <div className="text-xs font-mono text-white/70 mt-0.5">
                          {selectedAction === 'timer'
                            ? 'Begin tracking now — add job details later'
                            : selectedAction === 'note' ||
                                selectedAction === 'material' ||
                                selectedAction === 'photo' ||
                                selectedAction === 'voice' ||
                                selectedAction === 'attachment'
                              ? 'Save to inbox — assign to a job later'
                              : 'Create a new job and attach this item'}
                        </div>
                      </div>
                    </button>

                    {/* Divider */}
                    {jobs.length > 0 && (
                      <div className="flex items-center gap-3 py-2">
                        <div className="flex-1 h-px bg-navy/10" />
                        <span className="text-[10px] font-mono font-bold text-warm-gray uppercase tracking-wider">
                          or attach to existing job
                        </span>
                        <div className="flex-1 h-px bg-navy/10" />
                      </div>
                    )}

                    {jobs.map((job) => (
                      <button
                        key={job.id}
                        onClick={() => handleJobSelect(job.id)}
                        className="w-full text-left bg-white rounded-xl border border-navy/10 p-4 shadow-sm hover:bg-[#F0EBE3] transition-colors"
                      >
                        <div className="font-serif font-bold text-navy">
                          {job.short_description || 'Untitled Job'}
                        </div>
                        <div className="text-xs font-mono text-warm-gray mt-1">
                          {job.customer_name || 'No customer'}
                        </div>
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

```
```src/components/StatusBadge.tsx
import React from 'react'
import { motion } from 'framer-motion'
import { JobWorkStatus } from '../types'
interface Props {
  status: JobWorkStatus
  onClick?: () => void
  large?: boolean
}
const STATUS_CONFIG: Record<
  JobWorkStatus,
  {
    label: string
    bg: string
    text: string
    border: string
  }
> = {
  not_started: {
    label: 'Not Started',
    bg: 'bg-warm-gray/10',
    text: 'text-warm-gray',
    border: 'border-warm-gray/20',
  },
  in_progress: {
    label: 'In Progress',
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    border: 'border-blue-200/50',
  },
  completed: {
    label: 'Completed',
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    border: 'border-amber-200/50',
  },
  paid: {
    label: 'Paid',
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    border: 'border-emerald-200/50',
  },
  on_hold: {
    label: 'On Hold',
    bg: 'bg-purple-50',
    text: 'text-purple-700',
    border: 'border-purple-200/50',
  },
  canceled: {
    label: 'Canceled',
    bg: 'bg-red-50',
    text: 'text-red-400',
    border: 'border-red-200/50',
  },
}
export function StatusBadge({ status, onClick, large = false }: Props) {
  const config = STATUS_CONFIG[status] ?? STATUS_CONFIG['not_started']
  return (
    <motion.button
      whileTap={
        onClick
          ? {
              scale: 0.95,
            }
          : {}
      }
      onClick={onClick}
      disabled={!onClick}
      className={`
        font-mono font-bold uppercase tracking-wider rounded-full border
        ${large ? 'px-4 py-2 text-sm' : 'px-3 py-1 text-[11px]'}
        ${config.bg} ${config.text} ${config.border}
        ${onClick ? 'cursor-pointer hover:shadow-sm transition-all' : 'cursor-default'}
      `}
    >
      {config.label}
    </motion.button>
  )
}

```
```src/data.ts
import {
  Job,
  Session,
  MaterialEntry,
  Note,
  Attachment,
  JobRollup,
  PaymentState,
} from './types'

// Helper to calculate minutes between two ISO datetime strings
function getMinutesBetween(start: string, end: string | null): number {
  if (!end) return 0
  const startDate = new Date(start)
  const endDate = new Date(end)
  return Math.round((endDate.getTime() - startDate.getTime()) / 60000)
}

// Build JobRollup objects by joining data
export function buildJobRollups(
  jobs: Job[],
  sessions: Session[],
  materials: MaterialEntry[],
  notes: Note[],
  attachments: Attachment[],
): JobRollup[] {
  return jobs.map((job) => {
    const jobSessions = sessions.filter(
      (s) => s.job_id === job.id && s.session_status !== 'discarded',
    )
    const jobMaterials = materials.filter(
      (m) =>
        m.job_id === job.id || jobSessions.some((s) => s.id === m.session_id),
    )
    const jobNotes = notes.filter(
      (n) =>
        n.job_id === job.id || jobSessions.some((s) => s.id === n.session_id),
    )
    const jobAttachments = attachments.filter(
      (a) =>
        a.job_id === job.id || jobSessions.some((s) => s.id === a.session_id),
    )

    // Calculate derived fields
    const total_session_minutes = jobSessions.reduce(
      (sum, s) => sum + getMinutesBetween(s.started_at, s.ended_at),
      0,
    )
    const total_material_cost = jobMaterials.reduce(
      (sum, m) => sum + m.total_cost,
      0,
    )

    const total_invoiced_amount = job.direct_revenue_amount || 0
    const total_collected_amount = job.direct_collected_amount || 0

    const hasRevenue = total_invoiced_amount > 0
    const total_outstanding_amount = hasRevenue
      ? Math.max(total_invoiced_amount - total_collected_amount, 0)
      : null

    let rolled_up_payment_state: PaymentState | null = null
    if (hasRevenue) {
      rolled_up_payment_state =
        total_collected_amount >= total_invoiced_amount ? 'paid' : 'pending'
    }

    const estimated_profit = hasRevenue
      ? total_invoiced_amount - total_material_cost
      : null
    const net_per_hour =
      estimated_profit !== null && total_session_minutes > 0
        ? estimated_profit / (total_session_minutes / 60)
        : null

    // last_worked_at: ended_at of the most recent ended session
    const endedSessions = jobSessions
      .filter((s) => s.ended_at)
      .sort(
        (a, b) =>
          new Date(b.ended_at!).getTime() - new Date(a.ended_at!).getTime(),
      )
    const last_worked_at =
      endedSessions.length > 0 ? endedSessions[0].ended_at! : null

    // last_activity_at: most recent timestamp across all related data
    const allTimestamps = [
      job.updated_at,
      ...jobSessions.map((s) => s.updated_at),
      ...jobMaterials.map((m) => m.updated_at),
      ...jobNotes.map((n) => n.updated_at),
    ].map((t) => new Date(t).getTime())
    const last_activity_at = new Date(Math.max(...allTimestamps)).toISOString()

    // is_profit_complete: all 5 criteria met
    const is_profit_complete =
      !!job.job_date &&
      !!job.short_description &&
      jobSessions.length > 0 &&
      total_invoiced_amount > 0 &&
      (jobMaterials.length > 0 || job.no_materials_confirmed)

    return {
      ...job,
      sessions: jobSessions,
      materials: jobMaterials,
      notes: jobNotes,
      attachments: jobAttachments,
      total_session_minutes,
      total_material_cost,
      total_invoiced_amount,
      total_collected_amount,
      total_outstanding_amount,
      rolled_up_payment_state,
      estimated_profit,
      net_per_hour,
      is_profit_complete,
      last_worked_at,
      last_activity_at,
    }
  })
}

// Helper to generate dates relative to today
function daysAgo(days: number): string {
  const d = new Date()
  d.setDate(d.getDate() - days)
  return d.toISOString().split('T')[0]
}
function daysAgoISO(days: number, hour: number = 8): string {
  const d = new Date()
  d.setDate(d.getDate() - days)
  d.setHours(hour, 0, 0, 0)
  return d.toISOString()
}

// Sample Jobs — spread across Today, This Week, and Older
export const initialJobs: Job[] = [
  {
    id: 'j1',
    created_via: 'add_job',
    job_date: daysAgo(0), // TODAY
    short_description: 'Kitchen Faucet Replacement',
    job_type: 'Plumbing',
    customer_name: 'Johnson Residence',
    service_address: '123 Main St',
    job_work_status: 'in_progress',
    no_materials_confirmed: false,
    direct_revenue_amount: 350,
    direct_collected_amount: null,
    created_at: daysAgoISO(0, 8),
    updated_at: daysAgoISO(0, 11),
  },
  {
    id: 'j2',
    created_via: 'add_job',
    job_date: daysAgo(0), // TODAY
    short_description: 'Garbage Disposal Install',
    job_type: 'Plumbing',
    customer_name: 'Rivera Home',
    service_address: '88 Pine St',
    job_work_status: 'in_progress',
    no_materials_confirmed: false,
    direct_revenue_amount: 200,
    direct_collected_amount: null,
    created_at: daysAgoISO(0, 13),
    updated_at: daysAgoISO(0, 15),
  },
  {
    id: 'j3',
    created_via: 'add_job',
    job_date: daysAgo(2), // THIS WEEK
    short_description: 'Bathroom Remodel Phase 1',
    job_type: 'Handyman / General Home Services',
    customer_name: '412 Oak Street',
    service_address: '412 Oak Street',
    job_work_status: 'in_progress',
    no_materials_confirmed: false,
    direct_revenue_amount: 2400,
    direct_collected_amount: null,
    created_at: daysAgoISO(2, 7),
    updated_at: daysAgoISO(1, 15),
  },
  {
    id: 'j4',
    created_via: 'session_start',
    job_date: daysAgo(4), // THIS WEEK
    short_description: 'Emergency Pipe Repair',
    job_type: 'Plumbing',
    customer_name: 'Martinez Family',
    service_address: '789 Pine Ave',
    job_work_status: 'completed',
    no_materials_confirmed: false,
    direct_revenue_amount: 275,
    direct_collected_amount: 275,
    created_at: daysAgoISO(4, 21),
    updated_at: daysAgoISO(4, 23),
  },
  {
    id: 'j5',
    created_via: 'add_job',
    job_date: daysAgo(5), // THIS WEEK
    short_description: 'Electrical Panel Upgrade',
    job_type: 'Handyman / General Home Services',
    customer_name: 'Chen Property',
    service_address: '456 Elm Blvd',
    job_work_status: 'in_progress',
    no_materials_confirmed: false,
    direct_revenue_amount: 1800,
    direct_collected_amount: null,
    created_at: daysAgoISO(5, 7),
    updated_at: daysAgoISO(5, 16),
  },
  {
    id: 'j6',
    created_via: 'add_job',
    job_date: daysAgo(10), // OLDER
    short_description: 'Water Heater Install',
    job_type: 'Plumbing',
    customer_name: 'Thompson Home',
    service_address: '321 Cedar Ln',
    job_work_status: 'completed',
    no_materials_confirmed: false,
    direct_revenue_amount: 900,
    direct_collected_amount: 900,
    created_at: daysAgoISO(10, 9),
    updated_at: daysAgoISO(10, 14),
  },
  {
    id: 'j7',
    created_via: 'add_job',
    job_date: daysAgo(21), // OLDER
    short_description: 'Deck Railing Repair',
    job_type: 'Handyman / General Home Services',
    customer_name: 'Nguyen Residence',
    service_address: '55 Birch Ct',
    job_work_status: 'completed',
    no_materials_confirmed: false,
    direct_revenue_amount: 450,
    direct_collected_amount: 450,
    created_at: daysAgoISO(21, 8),
    updated_at: daysAgoISO(21, 12),
  },
]

// Sample Sessions — matched to dynamic job dates
export const initialSessions: Session[] = [
  {
    id: 's1',
    job_id: 'j1',
    entry_mode: 'live',
    session_status: 'ended',
    started_at: daysAgoISO(0, 9),
    ended_at: daysAgoISO(0, 10),
    discarded_at: null,
    created_at: daysAgoISO(0, 9),
    updated_at: daysAgoISO(0, 10),
  },
  {
    id: 's2',
    job_id: 'j2',
    entry_mode: 'live',
    session_status: 'ended',
    started_at: daysAgoISO(0, 13),
    ended_at: daysAgoISO(0, 15),
    discarded_at: null,
    created_at: daysAgoISO(0, 13),
    updated_at: daysAgoISO(0, 15),
  },
  {
    id: 's3',
    job_id: 'j3',
    entry_mode: 'live',
    session_status: 'ended',
    started_at: daysAgoISO(2, 8),
    ended_at: daysAgoISO(2, 16),
    discarded_at: null,
    created_at: daysAgoISO(2, 8),
    updated_at: daysAgoISO(2, 16),
  },
  {
    id: 's4',
    job_id: 'j3',
    entry_mode: 'live',
    session_status: 'ended',
    started_at: daysAgoISO(1, 8),
    ended_at: daysAgoISO(1, 14),
    discarded_at: null,
    created_at: daysAgoISO(1, 8),
    updated_at: daysAgoISO(1, 14),
  },
  {
    id: 's5',
    job_id: 'j4',
    entry_mode: 'live',
    session_status: 'ended',
    started_at: daysAgoISO(4, 21),
    ended_at: daysAgoISO(4, 23),
    discarded_at: null,
    created_at: daysAgoISO(4, 21),
    updated_at: daysAgoISO(4, 23),
  },
  {
    id: 's6',
    job_id: 'j5',
    entry_mode: 'live',
    session_status: 'ended',
    started_at: daysAgoISO(5, 8),
    ended_at: daysAgoISO(5, 16),
    discarded_at: null,
    created_at: daysAgoISO(5, 8),
    updated_at: daysAgoISO(5, 16),
  },
  {
    id: 's7',
    job_id: 'j6',
    entry_mode: 'live',
    session_status: 'ended',
    started_at: daysAgoISO(10, 10),
    ended_at: daysAgoISO(10, 13),
    discarded_at: null,
    created_at: daysAgoISO(10, 10),
    updated_at: daysAgoISO(10, 13),
  },
  {
    id: 's8',
    job_id: 'j7',
    entry_mode: 'live',
    session_status: 'ended',
    started_at: daysAgoISO(21, 9),
    ended_at: daysAgoISO(21, 12),
    discarded_at: null,
    created_at: daysAgoISO(21, 9),
    updated_at: daysAgoISO(21, 12),
  },
]

// Sample Materials — matched to dynamic dates
export const initialMaterials: MaterialEntry[] = [
  {
    id: 'm1',
    job_id: 'j1',
    session_id: null,
    description: 'Moen Faucet',
    quantity: 1,
    unit: 'ea',
    unit_cost: 75,
    total_cost: 75,
    purchase_date: daysAgo(0),
    created_at: daysAgoISO(0, 9),
    updated_at: daysAgoISO(0, 9),
  },
  {
    id: 'm2',
    job_id: 'j1',
    session_id: null,
    description: 'Teflon Tape & Sealant',
    quantity: 1,
    unit: 'kit',
    unit_cost: 10,
    total_cost: 10,
    purchase_date: daysAgo(0),
    created_at: daysAgoISO(0, 9),
    updated_at: daysAgoISO(0, 9),
  },
  {
    id: 'm3',
    job_id: 'j3',
    session_id: null,
    description: 'Drywall & Mud',
    quantity: 4,
    unit: 'sheets',
    unit_cost: 30,
    total_cost: 120,
    purchase_date: daysAgo(2),
    created_at: daysAgoISO(2, 10),
    updated_at: daysAgoISO(2, 10),
  },
  {
    id: 'm4',
    job_id: 'j3',
    session_id: null,
    description: 'Shower Pan',
    quantity: 1,
    unit: 'ea',
    unit_cost: 350,
    total_cost: 350,
    purchase_date: daysAgo(2),
    created_at: daysAgoISO(2, 10),
    updated_at: daysAgoISO(2, 10),
  },
  {
    id: 'm5',
    job_id: 'j3',
    session_id: null,
    description: 'Lumber (2x4s)',
    quantity: 12,
    unit: 'pcs',
    unit_cost: 17.5,
    total_cost: 210,
    purchase_date: daysAgo(1),
    created_at: daysAgoISO(1, 9),
    updated_at: daysAgoISO(1, 9),
  },
  {
    id: 'm6',
    job_id: 'j4',
    session_id: null,
    description: 'Copper Pipe 1/2"',
    quantity: 10,
    unit: 'ft',
    unit_cost: 2.5,
    total_cost: 25,
    purchase_date: daysAgo(4),
    created_at: daysAgoISO(4, 21),
    updated_at: daysAgoISO(4, 21),
  },
  {
    id: 'm7',
    job_id: 'j4',
    session_id: null,
    description: 'Fittings & Solder',
    quantity: 1,
    unit: 'kit',
    unit_cost: 17,
    total_cost: 17,
    purchase_date: daysAgo(4),
    created_at: daysAgoISO(4, 21),
    updated_at: daysAgoISO(4, 21),
  },
  {
    id: 'm8',
    job_id: 'j5',
    session_id: null,
    description: '200A Panel Box',
    quantity: 1,
    unit: 'ea',
    unit_cost: 280,
    total_cost: 280,
    purchase_date: daysAgo(5),
    created_at: daysAgoISO(5, 9),
    updated_at: daysAgoISO(5, 9),
  },
  {
    id: 'm9',
    job_id: 'j5',
    session_id: null,
    description: 'Breakers Assorted',
    quantity: 10,
    unit: 'ea',
    unit_cost: 19,
    total_cost: 190,
    purchase_date: daysAgo(5),
    created_at: daysAgoISO(5, 9),
    updated_at: daysAgoISO(5, 9),
  },
  {
    id: 'm10',
    job_id: 'j6',
    session_id: null,
    description: '50 Gal Gas Heater',
    quantity: 1,
    unit: 'ea',
    unit_cost: 410,
    total_cost: 410,
    purchase_date: daysAgo(10),
    created_at: daysAgoISO(10, 10),
    updated_at: daysAgoISO(10, 10),
  },
  {
    id: 'm11',
    job_id: 'j6',
    session_id: null,
    description: 'Venting & Gas Line Flex',
    quantity: 1,
    unit: 'kit',
    unit_cost: 35,
    total_cost: 35,
    purchase_date: daysAgo(10),
    created_at: daysAgoISO(10, 10),
    updated_at: daysAgoISO(10, 10),
  },
  {
    id: 'm12',
    job_id: 'j7',
    session_id: null,
    description: 'Deck Screws & Brackets',
    quantity: 1,
    unit: 'lot',
    unit_cost: 45,
    total_cost: 45,
    purchase_date: daysAgo(21),
    created_at: daysAgoISO(21, 9),
    updated_at: daysAgoISO(21, 9),
  },
]

// Sample Notes — matched to dynamic dates
export const initialNotes: Note[] = [
  {
    id: 'n1',
    job_id: 'j1',
    session_id: null,
    body: 'Client requested brushed nickel finish. Old valve was slightly corroded but salvageable.',
    created_at: daysAgoISO(0, 10),
    updated_at: daysAgoISO(0, 10),
  },
  {
    id: 'n2',
    job_id: 'j3',
    session_id: null,
    body: 'Demo completed. Found some water damage near the old tub drain. Will need to reinforce joists in Phase 2.',
    created_at: daysAgoISO(1, 13),
    updated_at: daysAgoISO(1, 13),
  },
  {
    id: 'n3',
    job_id: 'j4',
    session_id: null,
    body: 'Late night call. Burst pipe in the basement due to freezing.',
    created_at: daysAgoISO(4, 22),
    updated_at: daysAgoISO(4, 22),
  },
  {
    id: 'n4',
    job_id: 'j5',
    session_id: null,
    body: 'Upgraded from 100A to 200A. City inspector coming next Tuesday.',
    created_at: daysAgoISO(5, 15),
    updated_at: daysAgoISO(5, 15),
  },
  {
    id: 'n5',
    job_id: 'j6',
    session_id: null,
    body: 'Standard swap out. Hauled away the old unit.',
    created_at: daysAgoISO(10, 13),
    updated_at: daysAgoISO(10, 13),
  },
  {
    id: 'n6',
    job_id: 'j7',
    session_id: null,
    body: 'Replaced rotted posts and added new brackets. Customer happy with the result.',
    created_at: daysAgoISO(21, 11),
    updated_at: daysAgoISO(21, 11),
  },
]

// Sample Attachments (empty for now)
export const initialAttachments: Attachment[] = []

// Sample Inbox Captures
export const initialInboxCaptures = [
  {
    id: 'ic1',
    type: 'note' as const,
    body: 'Need to follow up on that leak under the kitchen sink at the rental property',
    file_url: null,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
  },
  {
    id: 'ic2',
    type: 'photo' as const,
    body: null,
    file_url: 'photo_pipe_damage.jpg',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
  },
  {
    id: 'ic3',
    type: 'voice_memo' as const,
    body: '2 min voice memo — measurements for the back deck railing',
    file_url: null,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
  },
  {
    id: 'ic4',
    type: 'note' as const,
    body: 'Customer at 88 Pine called about a dripping outdoor spigot',
    file_url: null,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
  },
  {
    id: 'ic5',
    type: 'photo' as const,
    body: null,
    file_url: 'photo_panel_closeup.jpg',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString(),
  },
]

```
```src/hooks/useTimer.ts
import { useState, useEffect, useRef } from 'react'

export function useTimer() {
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const [isRunning, setIsRunning] = useState(false)
  const intervalRef = useRef<number | null>(null)

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = window.setInterval(() => {
        setElapsedSeconds((prev) => prev + 1)
      }, 1000)
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current)
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [isRunning])

  const start = () => setIsRunning(true)
  const stop = () => setIsRunning(false)
  const reset = () => {
    setIsRunning(false)
    setElapsedSeconds(0)
  }

  const formatTime = (totalSeconds: number) => {
    const h = Math.floor(totalSeconds / 3600)
    const m = Math.floor((totalSeconds % 3600) / 60)
    const s = totalSeconds % 60
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }

  return {
    elapsedSeconds,
    formattedTime: formatTime(elapsedSeconds),
    isRunning,
    start,
    stop,
    reset,
  }
}

```
```src/pages/AddMaterial.tsx
import React, { useState } from 'react'
import { Session, MaterialEntry } from '../types'
import { ArrowLeftIcon, CameraIcon } from 'lucide-react'
import { motion } from 'framer-motion'
interface Props {
  jobId: string
  jobName: string
  sessions: Session[]
  onBack: () => void
  onSave: (
    jobId: string,
    material: Omit<MaterialEntry, 'id' | 'created_at' | 'updated_at'>,
  ) => void
}
function formatSessionLabel(session: Session): string {
  const date = new Date(session.started_at)
  return (
    date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }) +
    ' · ' +
    date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    })
  )
}
export function AddMaterial({
  jobId,
  jobName,
  sessions,
  onBack,
  onSave,
}: Props) {
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [description, setDescription] = useState('')
  const [totalCost, setTotalCost] = useState('')
  const [quantity, setQuantity] = useState(1)
  const [unit, setUnit] = useState('ea')
  const handleSave = () => {
    if (!description || !totalCost) return
    onSave(jobId, {
      job_id: jobId,
      session_id: sessionId,
      description,
      quantity,
      unit,
      unit_cost: parseFloat(totalCost) / quantity,
      total_cost: parseFloat(totalCost),
      purchase_date: new Date().toISOString().split('T')[0],
    })
  }
  return (
    <motion.div
      initial={{
        y: 20,
        opacity: 0,
      }}
      animate={{
        y: 0,
        opacity: 1,
      }}
      className="min-h-full pb-28 bg-notebook-ruled"
    >
      <div className="bg-cream px-4 pt-12 pb-4 shadow-sm sticky top-0 z-20">
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-field-red rounded-t-[44px]"></div>
        <button
          onClick={onBack}
          className="flex items-center text-warm-gray hover:text-navy mb-5 transition-colors"
        >
          <ArrowLeftIcon className="w-6 h-6" />
        </button>
        <h1 className="text-2xl font-serif font-bold tracking-widest uppercase text-navy">
          Add Material
        </h1>
        <p className="text-sm font-mono text-warm-gray mt-1">{jobName}</p>
      </div>

      <div className="p-4 space-y-6 mt-2">
        {/* Session Selector (Optional) */}
        {sessions.length > 0 && (
          <div>
            <label className="block text-xs font-mono font-bold text-warm-gray mb-2 uppercase tracking-wider">
              Assign to Session{' '}
              <span className="normal-case font-normal">(optional)</span>
            </label>
            <div className="relative">
              <select
                value={sessionId || ''}
                onChange={(e) => setSessionId(e.target.value || null)}
                className="w-full bg-white text-navy border border-navy/10 rounded-xl p-4 font-mono font-bold text-base appearance-none shadow-sm focus:outline-none focus:border-field-red focus:ring-2 focus:ring-field-red/20 transition-all"
              >
                <option value="">No session (general)</option>
                {sessions.map((s) => (
                  <option key={s.id} value={s.id}>
                    {formatSessionLabel(s)}
                  </option>
                ))}
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-warm-gray">
                ▼
              </div>
            </div>
          </div>
        )}

        {/* Material Description */}
        <div>
          <label className="block text-xs font-mono font-bold text-warm-gray mb-2 uppercase tracking-wider">
            Material Description
          </label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder='e.g. Copper Pipe 1/2"'
            className="w-full bg-white text-navy border border-navy/10 rounded-xl p-4 font-mono font-bold text-base shadow-sm focus:outline-none focus:border-field-red focus:ring-2 focus:ring-field-red/20 placeholder:text-warm-gray/40 transition-all"
          />
        </div>

        {/* Cost & Quantity Row */}
        <div className="flex gap-4">
          <div className="flex-1">
            <label className="block text-xs font-mono font-bold text-warm-gray mb-2 uppercase tracking-wider">
              Total Cost
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 font-mono font-bold text-lg text-warm-gray">
                $
              </span>
              <input
                type="number"
                value={totalCost}
                onChange={(e) => setTotalCost(e.target.value)}
                placeholder="0.00"
                step="0.01"
                className="w-full bg-white text-navy border border-navy/10 rounded-xl p-4 pl-8 font-mono font-bold text-lg tabular-nums shadow-sm focus:outline-none focus:border-field-red focus:ring-2 focus:ring-field-red/20 placeholder:text-warm-gray/40 transition-all"
              />
            </div>
          </div>

          <div className="w-32">
            <label className="block text-xs font-mono font-bold text-warm-gray mb-2 uppercase tracking-wider">
              Qty
            </label>
            <div className="flex items-center border border-navy/10 rounded-xl bg-white shadow-sm h-[60px] overflow-hidden">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="flex-1 h-full flex items-center justify-center font-mono font-bold text-xl text-warm-gray hover:bg-[#F0EBE3] active:bg-navy/10 transition-colors"
              >
                -
              </button>
              <div className="w-10 text-center font-mono font-bold text-lg tabular-nums text-navy">
                {quantity}
              </div>
              <button
                onClick={() => setQuantity(quantity + 1)}
                className="flex-1 h-full flex items-center justify-center font-mono font-bold text-xl text-warm-gray hover:bg-[#F0EBE3] active:bg-navy/10 transition-colors"
              >
                +
              </button>
            </div>
          </div>
        </div>

        {/* Unit selector */}
        <div>
          <label className="block text-xs font-mono font-bold text-warm-gray mb-2 uppercase tracking-wider">
            Unit
          </label>
          <div className="flex gap-2 flex-wrap">
            {['ea', 'ft', 'pcs', 'kit', 'lot', 'gal', 'lb'].map((u) => (
              <button
                key={u}
                onClick={() => setUnit(u)}
                className={`px-4 py-2 rounded-lg font-mono font-bold text-sm uppercase transition-all ${unit === u ? 'bg-navy text-white' : 'bg-white border border-navy/10 text-navy hover:bg-[#F0EBE3]'}`}
              >
                {u}
              </button>
            ))}
          </div>
        </div>

        {/* Receipt Photo (Mock) */}
        <button className="w-full border-2 border-dashed border-navy/20 rounded-2xl bg-white/50 p-6 flex flex-col items-center justify-center text-warm-gray hover:bg-white hover:border-navy/30 transition-all mt-4">
          <CameraIcon className="w-8 h-8 mb-3 text-gray-400" />
          <span className="font-mono font-bold uppercase tracking-wider text-sm">
            Add Receipt Photo
          </span>
        </button>

        {/* Save Button */}
        <div className="pt-6">
          <button
            onClick={handleSave}
            disabled={!description || !totalCost}
            className="w-full bg-field-red text-white rounded-2xl py-4 text-lg font-mono font-bold tracking-wider uppercase shadow-lg shadow-field-red/20 active:scale-95 transition-all disabled:opacity-50 disabled:active:scale-100 disabled:shadow-none"
          >
            Save Material
          </button>
        </div>
      </div>
    </motion.div>
  )
}

```
```src/pages/AddNote.tsx
import React, { useState } from 'react'
import { Session, Note } from '../types'
import { ArrowLeftIcon } from 'lucide-react'
import { motion } from 'framer-motion'
interface Props {
  jobId: string
  jobName: string
  sessions: Session[]
  onBack: () => void
  onSave: (
    jobId: string,
    note: Omit<Note, 'id' | 'created_at' | 'updated_at'>,
  ) => void
}
function formatSessionLabel(session: Session): string {
  const date = new Date(session.started_at)
  return (
    date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }) +
    ' · ' +
    date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    })
  )
}
export function AddNote({ jobId, jobName, sessions, onBack, onSave }: Props) {
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [body, setBody] = useState('')
  const handleSave = () => {
    if (!body.trim()) return
    onSave(jobId, {
      job_id: jobId,
      session_id: sessionId,
      body: body.trim(),
    })
  }
  return (
    <motion.div
      initial={{
        y: 20,
        opacity: 0,
      }}
      animate={{
        y: 0,
        opacity: 1,
      }}
      className="min-h-full pb-28 bg-notebook-ruled"
    >
      <div className="bg-cream px-4 pt-12 pb-4 shadow-sm sticky top-0 z-20">
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-field-red rounded-t-[44px]"></div>
        <button
          onClick={onBack}
          className="flex items-center text-warm-gray hover:text-navy mb-5 transition-colors"
        >
          <ArrowLeftIcon className="w-6 h-6" />
        </button>
        <h1 className="text-2xl font-serif font-bold tracking-widest uppercase text-navy">
          Add Note
        </h1>
        <p className="text-sm font-mono text-warm-gray mt-1">{jobName}</p>
      </div>

      <div className="p-4 space-y-6 mt-2">
        {/* Session Selector (Optional) */}
        {sessions.length > 0 && (
          <div>
            <label className="block text-xs font-mono font-bold text-warm-gray mb-2 uppercase tracking-wider">
              Assign to Session{' '}
              <span className="normal-case font-normal">(optional)</span>
            </label>
            <div className="relative">
              <select
                value={sessionId || ''}
                onChange={(e) => setSessionId(e.target.value || null)}
                className="w-full bg-white text-navy border border-navy/10 rounded-xl p-4 font-mono font-bold text-base appearance-none shadow-sm focus:outline-none focus:border-field-red focus:ring-2 focus:ring-field-red/20 transition-all"
              >
                <option value="">No session (general)</option>
                {sessions.map((s) => (
                  <option key={s.id} value={s.id}>
                    {formatSessionLabel(s)}
                  </option>
                ))}
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-warm-gray">
                ▼
              </div>
            </div>
          </div>
        )}

        {/* Note Body */}
        <div>
          <label className="block text-xs font-mono font-bold text-warm-gray mb-2 uppercase tracking-wider">
            Note Details
          </label>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="What happened on site today?"
            rows={6}
            className="w-full bg-white text-navy border border-navy/10 rounded-xl p-4 font-mono text-base shadow-sm focus:outline-none focus:border-field-red focus:ring-2 focus:ring-field-red/20 placeholder:text-warm-gray/40 transition-all resize-none"
          />
        </div>

        {/* Save Button */}
        <div className="pt-6">
          <button
            onClick={handleSave}
            disabled={!body.trim()}
            className="w-full bg-field-red text-white rounded-2xl py-4 text-lg font-mono font-bold tracking-wider uppercase shadow-lg shadow-field-red/20 active:scale-95 transition-all disabled:opacity-50 disabled:active:scale-100 disabled:shadow-none"
          >
            Save Note
          </button>
        </div>
      </div>
    </motion.div>
  )
}

```
```src/pages/HomeDashboard.tsx
import React from 'react'
import { JobRollup, Screen } from '../types'
import { JobCard } from '../components/JobCard'
import { PlusIcon, AlertCircleIcon, ClockIcon, UserIcon } from 'lucide-react'
import { motion } from 'framer-motion'
interface Props {
  jobs: JobRollup[]
  inboxCount: number
  onNavigate: (screen: Screen, jobId?: string) => void
  onOpenQuickCapture: () => void
}
export function HomeDashboard({
  jobs,
  inboxCount,
  onNavigate,
  onOpenQuickCapture,
}: Props) {
  // Calculate Profit Snapshot (This Week)
  // For simplicity in prototype, we just sum all jobs
  const totalRevenue = jobs.reduce((sum, j) => sum + j.total_invoiced_amount, 0)
  const totalExpenses = jobs.reduce((sum, j) => sum + j.total_material_cost, 0)
  const netEarnings = totalRevenue - totalExpenses
  // Needs Attention: Jobs not yet profit-complete
  const incompleteJobs = jobs.filter((j) => !j.is_profit_complete)
  // Jump Back In: Most recent jobs by updated_at (touched on any change)
  const recentJobs = [...jobs]
    .sort(
      (a, b) =>
        new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime(),
    )
    .slice(0, 3)
  return (
    <motion.div
      initial={{
        opacity: 0,
      }}
      animate={{
        opacity: 1,
      }}
      className="min-h-full pb-28 bg-notebook-ruled relative"
    >
      {/* Header */}
      <div className="bg-cream px-5 pt-12 pb-4 shadow-sm relative z-10">
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-field-red rounded-t-[44px]"></div>
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-serif font-bold tracking-widest text-navy">
            FIELD BOOK
          </h1>
          <button
            onClick={() => onNavigate('profile')}
            className="w-10 h-10 rounded-full bg-navy/5 border border-navy/10 flex items-center justify-center text-navy hover:bg-navy/10 transition-colors"
          >
            <UserIcon className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="px-5 pt-6 pb-4 space-y-8">
        {/* Profit Snapshot */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-mono font-bold text-warm-gray uppercase tracking-wider">
              Profit Snapshot
            </h2>
            <span className="text-[10px] font-mono font-bold text-warm-gray/60 uppercase tracking-wider">
              This Week
            </span>
          </div>
          <div
            onClick={() => onNavigate('earnings')}
            className="bg-white rounded-3xl border border-navy/10 p-6 shadow-sm cursor-pointer active:scale-[0.99] transition-transform"
          >
            <div className="text-center mb-6">
              <div className="text-[10px] font-mono font-bold text-warm-gray uppercase tracking-widest mb-1">
                Net Earnings
              </div>
              <div
                className={`text-4xl font-mono font-bold tabular-nums tracking-tighter ${netEarnings >= 0 ? 'text-emerald-600' : 'text-field-red'}`}
              >
                ${netEarnings.toFixed(2)}
              </div>
            </div>
            <div className="flex justify-between border-t border-navy/5 pt-4">
              <div>
                <div className="text-[10px] font-mono font-bold text-warm-gray uppercase tracking-wider mb-1">
                  Revenue
                </div>
                <div className="text-lg font-mono font-bold tabular-nums text-navy">
                  ${totalRevenue.toFixed(2)}
                </div>
              </div>
              <div className="text-right">
                <div className="text-[10px] font-mono font-bold text-warm-gray uppercase tracking-wider mb-1">
                  Expenses
                </div>
                <div className="text-lg font-mono font-bold tabular-nums text-field-red">
                  -${totalExpenses.toFixed(2)}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Needs Attention */}
        {(incompleteJobs.length > 0 || inboxCount > 0) && (
          <section>
            <h2 className="text-xs font-mono font-bold text-accent-red flex items-center uppercase tracking-wider mb-3">
              <AlertCircleIcon className="w-4 h-4 mr-2" />
              Needs Attention
            </h2>
            <div className="space-y-3">
              {inboxCount > 0 && (
                <div
                  onClick={() => onNavigate('inbox')}
                  className="bg-field-red/5 rounded-2xl border border-field-red/20 p-4 shadow-sm flex items-center justify-between cursor-pointer hover:shadow-md transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-field-red/10 flex items-center justify-center text-field-red shrink-0">
                      <span className="font-mono font-bold text-lg">
                        {inboxCount}
                      </span>
                    </div>
                    <div>
                      <div className="font-serif font-bold text-sm leading-tight text-navy">
                        Unsorted Captures
                      </div>
                      <div className="text-xs font-mono text-warm-gray mt-1">
                        Review and assign to jobs
                      </div>
                    </div>
                  </div>
                  <div className="text-field-red font-mono font-bold text-sm">
                    Review →
                  </div>
                </div>
              )}

              {incompleteJobs.slice(0, 3).map((job) => {
                const missing: string[] = []
                if (!job.short_description) missing.push('description')
                if (job.sessions.length === 0) missing.push('sessions')
                if (job.total_invoiced_amount === 0) missing.push('revenue')
                if (job.materials.length === 0 && !job.no_materials_confirmed)
                  missing.push('materials')
                return (
                  <div
                    key={job.id}
                    onClick={() => onNavigate('jobDetail', job.id)}
                    className="bg-amber-50 rounded-2xl border border-amber-200/50 p-4 shadow-sm flex items-center justify-between cursor-pointer hover:shadow-md transition-all"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="font-serif font-bold text-sm leading-tight text-navy">
                        {job.short_description || 'Untitled Job'}
                      </div>
                      <div className="text-xs font-mono text-amber-700/80 mt-1">
                        Missing: {missing.join(', ')}
                      </div>
                    </div>
                    <div className="text-amber-600 font-mono font-bold text-sm shrink-0 ml-3">
                      Fix →
                    </div>
                  </div>
                )
              })}
            </div>
          </section>
        )}

        {/* Jump Back In */}
        <section>
          <h2 className="text-xs font-mono font-bold text-warm-gray flex items-center uppercase tracking-wider mb-3">
            <ClockIcon className="w-4 h-4 mr-2" />
            Jump Back In
          </h2>
          <div className="space-y-4">
            {recentJobs.map((job) => (
              <JobCard
                key={job.id}
                job={job}
                onClick={() => onNavigate('jobDetail', job.id)}
                timeDisplay="lastUpdated"
              />
            ))}
          </div>
        </section>
      </div>

      {/* FAB */}
      <div className="sticky bottom-24 z-40 flex justify-end pr-5 pointer-events-none">
        <button
          onClick={onOpenQuickCapture}
          className="w-14 h-14 bg-field-red text-white rounded-full flex items-center justify-center shadow-lg shadow-field-red/30 active:scale-95 transition-all pointer-events-auto"
        >
          <PlusIcon className="w-7 h-7" strokeWidth={2.5} />
        </button>
      </div>
    </motion.div>
  )
}

```
```src/pages/JobDetail.tsx
import React, { useState, memo } from 'react'
import {
  JobRollup,
  Screen,
  Session,
  TimelineEvent,
  Job,
  JobWorkStatus,
} from '../types'
import { EarningsSummary } from '../components/EarningsSummary'
import { StatusBadge } from '../components/StatusBadge'
import { useDragControls } from 'framer-motion'
import {
  ArrowLeftIcon,
  ClockIcon,
  WrenchIcon,
  FileTextIcon,
  ActivityIcon,
  PencilIcon,
  CheckIcon,
  XIcon,
  Trash2Icon,
  ChevronDownIcon,
  ChevronUpIcon,
  DollarSignIcon,
  CameraIcon,
  MicIcon,
  AlertTriangleIcon,
  PlusIcon,
  PlayIcon,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
interface Props {
  job: JobRollup
  onBack: () => void
  onUpdateWorkStatus: (status: JobWorkStatus) => void
  onNavigate: (screen: Screen, jobId?: string) => void
  onUpdateJob: (
    updatedJob: Partial<Job> & {
      id: string
    },
  ) => void
  onDeleteSession: (sessionId: string) => void
  onUpdateSession: (sessionId: string, updates: Partial<Session>) => void
  onStartSession: (jobId: string) => void
  onAddPastSession: (
    jobId: string,
    startedAt: string,
    endedAt: string,
    revenue: number | null,
    sessionId?: string,
  ) => void
  onDeleteMaterial?: (materialId: string) => void
  onUpdateMaterial?: (materialId: string, updates: Partial<any>) => void
  onAddMaterial?: (jobId: string, material: any) => void
  onDeleteNote?: (noteId: string) => void
  onUpdateNote?: (noteId: string, updates: Partial<any>) => void
  onAddNote?: (jobId: string, note: any) => void
  onAddAttachment?: (jobId: string, attachment: any) => void
  onDeleteAttachment?: (attachmentId: string) => void
  onDeleteJob?: (jobId: string) => void
  userTrades?: string[]
  initialEditMode?: boolean
  isNewJob?: boolean
}
function isItemInSession(
  item: {
    session_id: string | null
    created_at: string
  },
  session: Session,
) {
  return item.session_id === session.id
}
function formatSessionTime(isoString: string): string {
  const date = new Date(isoString)
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })
}
function formatSessionDate(isoString: string): string {
  const date = new Date(isoString)
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}
function getSessionDurationHours(session: Session): number {
  if (!session.ended_at) return 0
  const start = new Date(session.started_at)
  const end = new Date(session.ended_at)
  const minutes = (end.getTime() - start.getTime()) / 60000
  return Math.round((minutes / 60) * 100) / 100
}
function formatTime(minutes: number): string {
  if (minutes === 0) return '0h'
  const hours = minutes / 60
  return `${hours.toFixed(1)}h`
}
function formatSessionDuration(session: Session): string {
  if (!session.ended_at) return '—'
  const start = new Date(session.started_at)
  const end = new Date(session.ended_at)
  const totalMinutes = (end.getTime() - start.getTime()) / 60000
  return `${(totalMinutes / 60).toFixed(1)}h`
}
function formatSessionLabel(session: Session): string {
  const date = new Date(session.started_at)
  return (
    date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    }) +
    ' · ' +
    date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    })
  )
}
function getTimelineIcon(type: TimelineEvent['type']) {
  switch (type) {
    case 'session_started':
      return {
        color: 'bg-field-red',
        label: '⏱',
      }
    case 'session_ended':
      return {
        color: 'bg-navy',
        label: '⏹',
      }
    case 'note_added':
      return {
        color: 'bg-amber-500',
        label: '📝',
      }
    case 'material_added':
      return {
        color: 'bg-emerald-500',
        label: '🔧',
      }
    case 'photo_added':
      return {
        color: 'bg-blue-500',
        label: '📷',
      }
    default:
      return {
        color: 'bg-warm-gray',
        label: '•',
      }
  }
}
const NEXT_STATUS: Partial<Record<JobWorkStatus, JobWorkStatus>> = {
  not_started: 'in_progress',
  in_progress: 'completed',
  completed: 'paid',
  on_hold: 'in_progress',
  canceled: 'not_started',
}
const NEXT_LABEL: Record<JobWorkStatus, string> = {
  not_started: 'Mark In Progress',
  in_progress: 'Mark Completed',
  completed: 'Mark Paid',
  on_hold: 'Resume Job',
  canceled: 'Reopen Job',
  paid: 'Mark Unpaid',
}
const STATUS_DISPLAY: Record<
  JobWorkStatus,
  {
    label: string
    color: string
  }
> = {
  not_started: {
    label: 'Not Started',
    color: 'bg-warm-gray/10 text-warm-gray border-warm-gray/20',
  },
  in_progress: {
    label: 'In Progress',
    color: 'bg-blue-50 text-blue-700 border-blue-200/50',
  },
  completed: {
    label: 'Completed',
    color: 'bg-amber-50 text-amber-700 border-amber-200/50',
  },
  paid: {
    label: 'Paid',
    color: 'bg-emerald-50 text-emerald-700 border-emerald-200/50',
  },
  on_hold: {
    label: 'On Hold',
    color: 'bg-purple-50 text-purple-700 border-purple-200/50',
  },
  canceled: {
    label: 'Canceled',
    color: 'bg-red-50 text-red-400 border-red-200/50',
  },
}
const ADVANCE_BUTTON_COLOR: Record<JobWorkStatus, string> = {
  not_started: 'bg-blue-600 text-white shadow-blue-600/20',
  in_progress: 'bg-amber-600 text-white shadow-amber-600/20',
  completed: 'bg-emerald-600 text-white shadow-emerald-600/20',
  on_hold: 'bg-blue-600 text-white shadow-blue-600/20',
  canceled: 'bg-navy text-white shadow-navy/20',
  paid: 'bg-white text-navy border border-navy/20',
}
export function JobDetail({
  job,
  onBack,
  onUpdateWorkStatus,
  onNavigate,
  onUpdateJob,
  onDeleteSession,
  onUpdateSession,
  onStartSession,
  onAddPastSession,
  onDeleteMaterial,
  onUpdateMaterial,
  onAddMaterial,
  onDeleteNote,
  onUpdateNote,
  onAddNote,
  onAddAttachment,
  onDeleteAttachment,
  onDeleteJob,
  userTrades = [],
  initialEditMode = false,
  isNewJob = false,
}: Props) {
  const workStatus = job.job_work_status
  const dragControls = useDragControls()
  const [showStatusPicker, setShowStatusPicker] = useState(false)
  // Delete confirmation state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  // Add session flow state
  const [showAddSessionMenu, setShowAddSessionMenu] = useState(false)
  const [showAddPastSession, setShowAddPastSession] = useState(false)
  const [pastSessionStart, setPastSessionStart] = useState('')
  const [pastSessionEnd, setPastSessionEnd] = useState('')
  // Inline add material state
  const [showAddMaterialInline, setShowAddMaterialInline] = useState(false)
  const [newMaterialDesc, setNewMaterialDesc] = useState('')
  const [newMaterialCost, setNewMaterialCost] = useState('')
  const [newMaterialQty, setNewMaterialQty] = useState('1')
  const [newMaterialUnit, setNewMaterialUnit] = useState('ea')
  const [newMaterialSessionId, setNewMaterialSessionId] = useState<
    string | null
  >(null)
  // Inline add note state
  const [showAddNoteInline, setShowAddNoteInline] = useState(false)
  const [newNoteBody, setNewNoteBody] = useState('')
  const [newNoteSessionId, setNewNoteSessionId] = useState<string | null>(null)
  // Past session inline note state
  const [showPastSessionNoteEditor, setShowPastSessionNoteEditor] =
    useState(false)
  const [pastSessionNoteBody, setPastSessionNoteBody] = useState('')
  const [pastSessionNoteSaved, setPastSessionNoteSaved] = useState(false)
  // Past session inline material state
  const [showPastSessionMaterialEditor, setShowPastSessionMaterialEditor] =
    useState(false)
  const [pastSessionMaterialDesc, setPastSessionMaterialDesc] = useState('')
  const [pastSessionMaterialCost, setPastSessionMaterialCost] = useState('')
  const [pastSessionMaterialQty, setPastSessionMaterialQty] = useState('1')
  const [pastSessionMaterialUnit, setPastSessionMaterialUnit] = useState('ea')
  const [pastSessionMaterialSaved, setPastSessionMaterialSaved] =
    useState(false)
  // Existing session inline note state
  const [inlineNoteSessionId, setInlineNoteSessionId] = useState<string | null>(
    null,
  )
  const [inlineNoteBody, setInlineNoteBody] = useState('')
  const [inlineNoteSavedSessionId, setInlineNoteSavedSessionId] = useState<
    string | null
  >(null)
  // Existing session inline material state
  const [inlineMaterialSessionId, setInlineMaterialSessionId] = useState<
    string | null
  >(null)
  const [inlineMaterialDesc, setInlineMaterialDesc] = useState('')
  const [inlineMaterialCost, setInlineMaterialCost] = useState('')
  const [inlineMaterialQty, setInlineMaterialQty] = useState('1')
  const [inlineMaterialUnit, setInlineMaterialUnit] = useState('ea')
  const [inlineMaterialSavedSessionId, setInlineMaterialSavedSessionId] =
    useState<string | null>(null)
  // Inline add photo state
  const [showAddPhotoInline, setShowAddPhotoInline] = useState(false)
  const [newPhotoFileName, setNewPhotoFileName] = useState('')
  const [newPhotoCaption, setNewPhotoCaption] = useState('')
  const [newPhotoSessionId, setNewPhotoSessionId] = useState<string | null>(
    null,
  )
  // Inline add voice state
  const [showAddVoiceInline, setShowAddVoiceInline] = useState(false)
  const [newVoiceTranscription, setNewVoiceTranscription] = useState('')
  const [newVoiceSessionId, setNewVoiceSessionId] = useState<string | null>(
    null,
  )
  // Inline add attachment state
  const [showAddAttachmentInline, setShowAddAttachmentInline] = useState(false)
  const [newAttachmentFileName, setNewAttachmentFileName] = useState('')
  const [newAttachmentSessionId, setNewAttachmentSessionId] = useState<
    string | null
  >(null)
  // Edit state for job info
  const [isEditingJob, setIsEditingJob] = useState(initialEditMode)
  const [editDescription, setEditDescription] = useState(
    job.short_description || '',
  )
  const [editCustomer, setEditCustomer] = useState(job.customer_name || '')
  const [editAddress, setEditAddress] = useState(job.service_address || '')
  const [editRevenue, setEditRevenue] = useState(
    String(job.direct_revenue_amount || ''),
  )
  const [editJobType, setEditJobType] = useState(job.job_type || '')
  // Session expand/edit state
  const [expandedSessionId, setExpandedSessionId] = useState<string | null>(
    null,
  )
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null)
  const [editSessionStart, setEditSessionStart] = useState('')
  const [editSessionEnd, setEditSessionEnd] = useState('')
  // Materials edit state
  const [editingMaterialId, setEditingMaterialId] = useState<string | null>(
    null,
  )
  const [editMaterialDesc, setEditMaterialDesc] = useState('')
  const [editMaterialQty, setEditMaterialQty] = useState('')
  const [editMaterialCost, setEditMaterialCost] = useState('')
  const [editMaterialUnit, setEditMaterialUnit] = useState('ea')
  const [editMaterialSessionId, setEditMaterialSessionId] = useState<
    string | null
  >(null)
  // Notes edit state
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null)
  const [editNoteBody, setEditNoteBody] = useState('')
  const [editNoteSessionId, setEditNoteSessionId] = useState<string | null>(
    null,
  )
  const handleStartEditSession = (session: Session) => {
    setEditingSessionId(session.id)
    setEditSessionStart(session.started_at.slice(0, 16))
    setEditSessionEnd(session.ended_at ? session.ended_at.slice(0, 16) : '')
  }
  const handleSaveSession = (sessionId: string) => {
    const updates: Partial<Session> = {
      started_at: new Date(editSessionStart).toISOString(),
      ended_at: editSessionEnd ? new Date(editSessionEnd).toISOString() : null,
    }
    onUpdateSession(sessionId, updates)
    setEditingSessionId(null)
  }
  const handleCancelEditSession = () => {
    setEditingSessionId(null)
  }
  const toggleSessionExpand = (sessionId: string) => {
    if (editingSessionId === sessionId) return
    setExpandedSessionId(expandedSessionId === sessionId ? null : sessionId)
    if (editingSessionId) setEditingSessionId(null)
  }
  const handleSaveJob = () => {
    onUpdateJob({
      id: job.id,
      short_description: editDescription || null,
      customer_name: editCustomer || null,
      service_address: editAddress || null,
      direct_revenue_amount: editRevenue ? parseFloat(editRevenue) : null,
      job_type: editJobType || null,
    })
    setIsEditingJob(false)
  }
  const handleCancelEditJob = () => {
    if (isNewJob) {
      onBack()
      return
    }
    setEditDescription(job.short_description || '')
    setEditCustomer(job.customer_name || '')
    setEditAddress(job.service_address || '')
    setEditRevenue(String(job.direct_revenue_amount || ''))
    setEditJobType(job.job_type || '')
    setIsEditingJob(false)
  }
  // Generate timeline events
  const timelineEvents: TimelineEvent[] = []
  job.sessions.forEach((s) => {
    timelineEvents.push({
      id: `ts_${s.id}_start`,
      type: 'session_started',
      description: 'Session Started',
      occurred_at: s.started_at,
      job_id: job.id,
    })
    if (s.ended_at) {
      timelineEvents.push({
        id: `ts_${s.id}_end`,
        type: 'session_ended',
        description: `Session Ended (${getSessionDurationHours(s).toFixed(2)}h)`,
        occurred_at: s.ended_at,
        job_id: job.id,
      })
    }
  })
  job.materials.forEach((m) => {
    timelineEvents.push({
      id: `tm_${m.id}`,
      type: 'material_added',
      description: `${m.description || 'Material'} — $${m.total_cost}`,
      occurred_at: m.created_at,
      job_id: job.id,
    })
  })
  job.notes.forEach((n) => {
    timelineEvents.push({
      id: `tn_${n.id}`,
      type: 'note_added',
      description: n.body.length > 60 ? n.body.substring(0, 60) + '…' : n.body,
      occurred_at: n.created_at,
      job_id: job.id,
    })
  })
  timelineEvents.sort(
    (a, b) =>
      new Date(b.occurred_at).getTime() - new Date(a.occurred_at).getTime(),
  )
  return (
    <motion.div
      initial={{
        y: '100%',
      }}
      animate={{
        y: 0,
      }}
      exit={{
        y: '100%',
      }}
      transition={{
        type: 'spring',
        damping: 25,
        stiffness: 200,
      }}
      className="absolute inset-0 bg-notebook-ruled overflow-y-auto pb-28 z-50"
    >
      {/* Header */}
      <div className="bg-cream px-4 pt-12 pb-4">
        <div className="flex items-center justify-between mb-5">
          <button
            onClick={onBack}
            className="flex items-center justify-center w-8 h-8 rounded-full bg-navy/5 text-warm-gray hover:text-navy hover:bg-navy/10 transition-colors"
          >
            <XIcon className="w-5 h-5" />
          </button>
          {!isEditingJob && (
            <button
              onClick={() => setIsEditingJob(true)}
              className="flex items-center gap-1.5 text-xs font-mono font-bold text-field-red uppercase tracking-wider bg-field-red/10 px-3 py-1.5 rounded-full"
            >
              <PencilIcon className="w-3.5 h-3.5" />
              Edit
            </button>
          )}
        </div>

        <AnimatePresence mode="wait">
          {isEditingJob ? (
            <motion.div
              key="editing"
              initial={{
                opacity: 0,
              }}
              animate={{
                opacity: 1,
              }}
              exit={{
                opacity: 0,
              }}
              className="space-y-3"
            >
              <input
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                placeholder="Job description"
                className="w-full bg-white text-navy border border-navy/10 rounded-lg px-3 py-2 font-serif font-bold text-lg focus:outline-none focus:border-field-red focus:ring-1 focus:ring-field-red/20"
              />
              <input
                value={editCustomer}
                onChange={(e) => setEditCustomer(e.target.value)}
                placeholder="Customer name"
                className="w-full bg-white text-navy border border-navy/10 rounded-lg px-3 py-2 font-mono text-sm focus:outline-none focus:border-field-red focus:ring-1 focus:ring-field-red/20"
              />
              <input
                value={editAddress}
                onChange={(e) => setEditAddress(e.target.value)}
                placeholder="Service address"
                className="w-full bg-white text-navy border border-navy/10 rounded-lg px-3 py-2 font-mono text-sm focus:outline-none focus:border-field-red focus:ring-1 focus:ring-field-red/20"
              />
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono font-bold text-warm-gray">
                  $
                </span>
                <input
                  type="number"
                  value={editRevenue}
                  onChange={(e) => setEditRevenue(e.target.value)}
                  placeholder="Revenue"
                  className="w-full bg-white text-navy border border-navy/10 rounded-lg pl-7 pr-3 py-2 font-mono text-sm focus:outline-none focus:border-field-red focus:ring-1 focus:ring-field-red/20"
                />
              </div>
              <select
                value={editJobType}
                onChange={(e) => setEditJobType(e.target.value)}
                className="w-full bg-white text-navy border border-navy/10 rounded-lg px-3 py-2 font-mono text-sm focus:outline-none focus:border-field-red focus:ring-1 focus:ring-field-red/20 appearance-none"
              >
                <option value="">Select job type...</option>
                {userTrades.map((trade) => (
                  <option key={trade} value={trade}>
                    {trade}
                  </option>
                ))}
              </select>
              <div className="flex gap-2 pt-1">
                <button
                  onClick={handleSaveJob}
                  className="flex-1 flex items-center justify-center gap-1.5 bg-emerald-600 text-white rounded-lg py-2 text-xs font-mono font-bold uppercase tracking-wider active:scale-95 transition-all"
                >
                  <CheckIcon className="w-4 h-4" /> Save
                </button>
                <button
                  onClick={handleCancelEditJob}
                  className="flex-1 flex items-center justify-center gap-1.5 bg-white text-navy border border-navy/10 rounded-lg py-2 text-xs font-mono font-bold uppercase tracking-wider active:scale-95 transition-all"
                >
                  <XIcon className="w-4 h-4" /> Cancel
                </button>
              </div>
              {onDeleteJob && (
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="w-full flex items-center justify-center gap-1.5 bg-white text-field-red border border-field-red/20 rounded-lg py-2.5 text-xs font-mono font-bold uppercase tracking-wider active:scale-95 transition-all mt-2"
                >
                  <Trash2Icon className="w-3.5 h-3.5" /> Delete Job
                </button>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="display"
              initial={{
                opacity: 0,
              }}
              animate={{
                opacity: 1,
              }}
              exit={{
                opacity: 0,
              }}
            >
              <div className="flex justify-between items-start gap-4">
                <h1 className="text-2xl font-serif font-bold leading-tight text-navy">
                  {job.short_description || 'Untitled Job'}
                </h1>
                <div className="shrink-0 mt-1">
                  <StatusBadge
                    status={workStatus}
                    onClick={() => setShowStatusPicker((v) => !v)}
                  />
                </div>
              </div>
              <p className="text-warm-gray mt-2 font-mono font-medium">
                {job.customer_name || 'No customer'}
              </p>
              {job.service_address && (
                <p className="text-warm-gray/70 mt-1 font-mono text-sm">
                  {job.service_address}
                </p>
              )}
              {job.job_type && (
                <div className="mt-3">
                  <span className="inline-block bg-navy rounded-md text-[11px] font-mono font-bold px-2 py-1 text-white uppercase tracking-wider">
                    {job.job_type}
                  </span>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="p-4 space-y-8">
        <div>
          <EarningsSummary
            revenue={job.total_invoiced_amount}
            materials={job.total_material_cost}
          />
          <div className="mt-3 space-y-2">
            {/* Two-button status row */}
            <div className="flex gap-2">
              <button
                onClick={() => {
                  const next =
                    workStatus === 'paid'
                      ? 'completed'
                      : NEXT_STATUS[workStatus]
                  if (next) onUpdateWorkStatus(next as JobWorkStatus)
                }}
                className={`flex-1 py-3 rounded-xl text-sm font-mono font-bold tracking-wider uppercase transition-all shadow-sm active:scale-95 ${ADVANCE_BUTTON_COLOR[workStatus]}`}
              >
                {NEXT_LABEL[workStatus]}
              </button>
              <button
                onClick={() => setShowStatusPicker((v) => !v)}
                className="px-4 py-3 rounded-xl text-sm font-mono font-bold tracking-wider uppercase transition-all shadow-sm active:scale-95 bg-white text-navy border border-navy/20 hover:bg-[#F0EBE3] whitespace-nowrap"
              >
                Change Status
              </button>
            </div>

            {/* Inline status picker */}
            <AnimatePresence>
              {showStatusPicker && (
                <motion.div
                  initial={{
                    height: 0,
                    opacity: 0,
                  }}
                  animate={{
                    height: 'auto',
                    opacity: 1,
                  }}
                  exit={{
                    height: 0,
                    opacity: 0,
                  }}
                  transition={{
                    duration: 0.2,
                  }}
                  className="overflow-hidden"
                >
                  <div className="bg-white rounded-2xl border border-navy/10 shadow-sm p-3">
                    <div className="text-[10px] font-mono font-bold text-warm-gray uppercase tracking-wider mb-2 px-1">
                      Set Status
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {(Object.keys(STATUS_DISPLAY) as JobWorkStatus[]).map(
                        (s) => (
                          <button
                            key={s}
                            onClick={() => {
                              onUpdateWorkStatus(s)
                              setShowStatusPicker(false)
                            }}
                            className={`py-2.5 px-3 rounded-xl border text-xs font-mono font-bold uppercase tracking-wider transition-all active:scale-95 text-left ${STATUS_DISPLAY[s].color} ${workStatus === s ? 'ring-2 ring-offset-1 ring-navy/20' : ''}`}
                          >
                            {STATUS_DISPLAY[s].label}
                          </button>
                        ),
                      )}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Quick Stats Bar */}
        <div className="bg-white rounded-2xl border border-navy/10 p-4 shadow-sm grid grid-cols-3 gap-4 divide-x divide-navy/5">
          <div className="flex flex-col items-center text-center">
            <span className="text-[10px] font-mono font-bold text-warm-gray uppercase tracking-wider mb-1">
              Total Time
            </span>
            <span className="text-lg font-mono font-bold text-navy flex items-center gap-1">
              <ClockIcon className="w-4 h-4 text-navy/50" />
              {formatTime(job.total_session_minutes)}
            </span>
          </div>
          <div className="flex flex-col items-center text-center">
            <span className="text-[10px] font-mono font-bold text-warm-gray uppercase tracking-wider mb-1">
              Net/Hr
            </span>
            <span className="text-lg font-mono font-bold text-emerald-600">
              {job.net_per_hour ? `${job.net_per_hour.toFixed(0)}/hr` : '—'}
            </span>
          </div>
          <div className="flex flex-col items-center text-center">
            <span className="text-[10px] font-mono font-bold text-warm-gray uppercase tracking-wider mb-1">
              Sessions
            </span>
            <span className="text-lg font-mono font-bold text-navy">
              {job.sessions.length}
            </span>
          </div>
        </div>

        {/* Sessions Section */}
        <section>
          <div className="flex justify-between items-center mb-4 border-b border-navy/10 pb-2">
            <h2 className="text-sm font-mono font-bold text-accent-red flex items-center uppercase tracking-wider">
              <ClockIcon className="w-4 h-4 mr-2" />
              Sessions
            </h2>
            <button
              onClick={() => setShowAddSessionMenu(!showAddSessionMenu)}
              className="text-xs font-mono font-bold text-field-red uppercase tracking-wider bg-field-red/10 px-3 py-1 rounded-full"
            >
              + Add
            </button>
          </div>

          <AnimatePresence>
            {showAddSessionMenu && !showAddPastSession && (
              <motion.div
                initial={{
                  height: 0,
                  opacity: 0,
                }}
                animate={{
                  height: 'auto',
                  opacity: 1,
                }}
                exit={{
                  height: 0,
                  opacity: 0,
                }}
                transition={{
                  duration: 0.2,
                }}
                className="overflow-hidden mb-4"
              >
                <div className="bg-white rounded-2xl border border-navy/10 shadow-sm p-4 space-y-2">
                  <div className="text-[10px] font-mono font-bold text-warm-gray uppercase tracking-wider mb-2">
                    What type of session?
                  </div>
                  <button
                    onClick={() => {
                      setShowAddSessionMenu(false)
                      onStartSession(job.id)
                    }}
                    className="w-full flex items-center gap-3 bg-field-red/5 rounded-xl border border-field-red/20 p-3.5 active:scale-[0.98] transition-all"
                  >
                    <div className="w-10 h-10 rounded-full bg-field-red/10 flex items-center justify-center text-field-red shrink-0">
                      <ClockIcon className="w-5 h-5" strokeWidth={2.5} />
                    </div>
                    <div className="text-left">
                      <div className="font-mono font-bold text-navy text-sm">
                        Live Session
                      </div>
                      <div className="text-[10px] font-mono text-warm-gray mt-0.5">
                        Start a timer now
                      </div>
                    </div>
                  </button>
                  <button
                    onClick={() => {
                      setShowAddPastSession(true)
                      const now = new Date()
                      const todayStr = now.toISOString().slice(0, 10)
                      setPastSessionStart(todayStr + 'T09:00')
                      setPastSessionEnd(todayStr + 'T17:00')
                    }}
                    className="w-full flex items-center gap-3 bg-navy/5 rounded-xl border border-navy/10 p-3.5 active:scale-[0.98] transition-all"
                  >
                    <div className="w-10 h-10 rounded-full bg-navy/10 flex items-center justify-center text-navy shrink-0">
                      <PencilIcon className="w-5 h-5" strokeWidth={2.5} />
                    </div>
                    <div className="text-left">
                      <div className="font-mono font-bold text-navy text-sm">
                        Past Session
                      </div>
                      <div className="text-[10px] font-mono text-warm-gray mt-0.5">
                        Log a completed session manually
                      </div>
                    </div>
                  </button>
                  <button
                    onClick={() => setShowAddSessionMenu(false)}
                    className="w-full py-2 text-xs font-mono font-bold text-warm-gray uppercase tracking-wider"
                  >
                    Cancel
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {showAddPastSession && (
              <motion.div
                initial={{
                  height: 0,
                  opacity: 0,
                }}
                animate={{
                  height: 'auto',
                  opacity: 1,
                }}
                exit={{
                  height: 0,
                  opacity: 0,
                }}
                transition={{
                  duration: 0.2,
                }}
                className="overflow-hidden mb-4"
              >
                <div className="bg-white rounded-2xl border border-navy/10 shadow-sm p-4">
                  <div className="text-xs font-mono font-bold text-navy uppercase tracking-wider mb-4 flex items-center gap-2">
                    <PencilIcon className="w-3.5 h-3.5 text-field-red" />
                    Log Past Session
                  </div>
                  <div className="space-y-3 mb-4">
                    <div>
                      <label className="block text-[10px] font-mono font-bold text-warm-gray uppercase tracking-wider mb-1">
                        Start Time
                      </label>
                      <input
                        type="datetime-local"
                        value={pastSessionStart}
                        onChange={(e) => setPastSessionStart(e.target.value)}
                        className="w-full bg-cream text-navy border border-navy/10 rounded-lg px-3 py-2.5 font-mono text-sm focus:outline-none focus:border-field-red focus:ring-1 focus:ring-field-red/20"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-mono font-bold text-warm-gray uppercase tracking-wider mb-1">
                        End Time
                      </label>
                      <input
                        type="datetime-local"
                        value={pastSessionEnd}
                        onChange={(e) => setPastSessionEnd(e.target.value)}
                        className="w-full bg-cream text-navy border border-navy/10 rounded-lg px-3 py-2.5 font-mono text-sm focus:outline-none focus:border-field-red focus:ring-1 focus:ring-field-red/20"
                      />
                    </div>
                  </div>
                  <div className="mb-4">
                    <div className="text-[10px] font-mono font-bold text-warm-gray uppercase tracking-wider mb-2">
                      Add to this session
                    </div>
                    <div className="grid grid-cols-4 gap-2">
                      <button
                        onClick={() => {
                          setShowAddPhotoInline(true)
                          setNewPhotoFileName('')
                          setNewPhotoCaption('')
                          setNewPhotoSessionId(null)
                        }}
                        className="bg-cream rounded-xl border border-navy/10 py-2.5 flex flex-col items-center justify-center gap-1.5 active:scale-95 transition-all"
                      >
                        <CameraIcon className="w-4 h-4 text-blue-600" />
                        <span className="font-mono font-bold uppercase tracking-wider text-[8px] text-navy">
                          Photo
                        </span>
                      </button>
                      <button
                        onClick={() => {
                          setShowPastSessionNoteEditor((v) => !v)
                          if (!showPastSessionNoteEditor) {
                            setPastSessionNoteBody('')
                          }
                        }}
                        className={`rounded-xl border py-2.5 flex flex-col items-center justify-center gap-1.5 active:scale-95 transition-all ${showPastSessionNoteEditor ? 'bg-amber-50 border-amber-300' : 'bg-cream border-navy/10'}`}
                      >
                        <FileTextIcon
                          className={`w-4 h-4 ${showPastSessionNoteEditor ? 'text-amber-600' : 'text-amber-600'}`}
                        />
                        <span className="font-mono font-bold uppercase tracking-wider text-[8px] text-navy">
                          Note
                        </span>
                      </button>
                      <button
                        onClick={() => {
                          setShowAddVoiceInline(true)
                          setNewVoiceTranscription('')
                          setNewVoiceSessionId(null)
                        }}
                        className="bg-cream rounded-xl border border-navy/10 py-2.5 flex flex-col items-center justify-center gap-1.5 active:scale-95 transition-all"
                      >
                        <MicIcon className="w-4 h-4 text-purple-600" />
                        <span className="font-mono font-bold uppercase tracking-wider text-[8px] text-navy">
                          Voice
                        </span>
                      </button>
                      <button
                        onClick={() => {
                          setShowPastSessionMaterialEditor((v) => !v)
                          if (!showPastSessionMaterialEditor) {
                            setPastSessionMaterialDesc('')
                            setPastSessionMaterialCost('')
                            setPastSessionMaterialQty('1')
                            setPastSessionMaterialUnit('ea')
                          }
                        }}
                        className={`rounded-xl border py-2.5 flex flex-col items-center justify-center gap-1.5 active:scale-95 transition-all ${showPastSessionMaterialEditor ? 'bg-emerald-50 border-emerald-300' : 'bg-cream border-navy/10'}`}
                      >
                        <WrenchIcon className="w-4 h-4 text-emerald-600" />
                        <span className="font-mono font-bold uppercase tracking-wider text-[8px] text-navy">
                          Material
                        </span>
                      </button>
                    </div>
                  </div>

                  {/* Inline material editor for past session */}
                  <AnimatePresence>
                    {showPastSessionMaterialEditor && (
                      <motion.div
                        initial={{
                          height: 0,
                          opacity: 0,
                        }}
                        animate={{
                          height: 'auto',
                          opacity: 1,
                        }}
                        exit={{
                          height: 0,
                          opacity: 0,
                        }}
                        transition={{
                          duration: 0.2,
                        }}
                        className="overflow-hidden mb-4"
                      >
                        <div className="bg-emerald-50/60 rounded-xl border border-emerald-200/60 p-3">
                          <div className="flex items-center gap-1.5 mb-2">
                            <WrenchIcon className="w-3.5 h-3.5 text-emerald-600" />
                            <span className="text-[10px] font-mono font-bold text-emerald-700 uppercase tracking-wider">
                              Material for this session
                            </span>
                          </div>
                          <div className="space-y-2">
                            <input
                              value={pastSessionMaterialDesc}
                              onChange={(e) =>
                                setPastSessionMaterialDesc(e.target.value)
                              }
                              placeholder='e.g. Copper Pipe 1/2"'
                              autoFocus
                              className="w-full bg-white text-navy border border-emerald-200/60 rounded-lg px-3 py-2 font-mono text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 placeholder:text-warm-gray/40"
                            />
                            <div className="flex gap-2">
                              <div className="relative flex-1">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono font-bold text-warm-gray text-sm">
                                  $
                                </span>
                                <input
                                  type="number"
                                  value={pastSessionMaterialCost}
                                  onChange={(e) =>
                                    setPastSessionMaterialCost(e.target.value)
                                  }
                                  placeholder="0.00"
                                  step="0.01"
                                  className="w-full bg-white text-navy border border-emerald-200/60 rounded-lg pl-7 pr-3 py-2 font-mono text-sm tabular-nums focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 placeholder:text-warm-gray/40"
                                />
                              </div>
                              <input
                                type="number"
                                value={pastSessionMaterialQty}
                                onChange={(e) =>
                                  setPastSessionMaterialQty(e.target.value)
                                }
                                placeholder="Qty"
                                className="w-14 bg-white text-navy border border-emerald-200/60 rounded-lg px-2 py-2 font-mono text-sm text-center focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20"
                              />
                              <div className="relative">
                                <select
                                  value={pastSessionMaterialUnit}
                                  onChange={(e) =>
                                    setPastSessionMaterialUnit(e.target.value)
                                  }
                                  className="bg-white text-navy border border-emerald-200/60 rounded-lg px-2 py-2 font-mono text-sm focus:outline-none focus:border-emerald-500 appearance-none pr-6"
                                >
                                  {[
                                    'ea',
                                    'ft',
                                    'pcs',
                                    'kit',
                                    'lot',
                                    'gal',
                                    'lb',
                                  ].map((u) => (
                                    <option key={u} value={u}>
                                      {u}
                                    </option>
                                  ))}
                                </select>
                                <div className="absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none text-warm-gray text-[10px]">
                                  ▼
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Saved material confirmation chip */}
                  <AnimatePresence>
                    {pastSessionMaterialSaved &&
                      !showPastSessionMaterialEditor && (
                        <motion.div
                          initial={{
                            opacity: 0,
                            y: -4,
                          }}
                          animate={{
                            opacity: 1,
                            y: 0,
                          }}
                          exit={{
                            opacity: 0,
                          }}
                          className="mb-4 flex items-center gap-2 bg-emerald-50 border border-emerald-200/60 rounded-lg px-3 py-2"
                        >
                          <CheckIcon className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span className="font-mono text-xs text-emerald-700 flex-1 truncate">
                            Material added — will save with session
                          </span>
                          <button
                            onClick={() =>
                              setShowPastSessionMaterialEditor(true)
                            }
                            className="text-[10px] font-mono font-bold text-emerald-600 uppercase tracking-wider"
                          >
                            Edit
                          </button>
                        </motion.div>
                      )}
                  </AnimatePresence>

                  {/* Inline note editor for past session */}
                  <AnimatePresence>
                    {showPastSessionNoteEditor && (
                      <motion.div
                        initial={{
                          height: 0,
                          opacity: 0,
                        }}
                        animate={{
                          height: 'auto',
                          opacity: 1,
                        }}
                        exit={{
                          height: 0,
                          opacity: 0,
                        }}
                        transition={{
                          duration: 0.2,
                        }}
                        className="overflow-hidden mb-4"
                      >
                        <div className="bg-amber-50/60 rounded-xl border border-amber-200/60 p-3">
                          <div className="flex items-center gap-1.5 mb-2">
                            <FileTextIcon className="w-3.5 h-3.5 text-amber-600" />
                            <span className="text-[10px] font-mono font-bold text-amber-700 uppercase tracking-wider">
                              Note for this session
                            </span>
                          </div>
                          <textarea
                            value={pastSessionNoteBody}
                            onChange={(e) =>
                              setPastSessionNoteBody(e.target.value)
                            }
                            placeholder="What happened? Observations, measurements, next steps..."
                            rows={3}
                            autoFocus
                            className="w-full bg-white text-navy border border-amber-200/60 rounded-lg px-3 py-2 font-mono text-sm leading-relaxed focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/20 placeholder:text-warm-gray/40 resize-none"
                          />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Saved note confirmation chip */}
                  <AnimatePresence>
                    {pastSessionNoteSaved && !showPastSessionNoteEditor && (
                      <motion.div
                        initial={{
                          opacity: 0,
                          y: -4,
                        }}
                        animate={{
                          opacity: 1,
                          y: 0,
                        }}
                        exit={{
                          opacity: 0,
                        }}
                        className="mb-4 flex items-center gap-2 bg-amber-50 border border-amber-200/60 rounded-lg px-3 py-2"
                      >
                        <CheckIcon className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                        <span className="font-mono text-xs text-amber-700 flex-1 truncate">
                          Note added — will save with session
                        </span>
                        <button
                          onClick={() => {
                            setShowPastSessionNoteEditor(true)
                          }}
                          className="text-[10px] font-mono font-bold text-amber-600 uppercase tracking-wider"
                        >
                          Edit
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div className="flex gap-2">
                    {showPastSessionMaterialEditor ? (
                      <>
                        <button
                          onClick={() => {
                            if (
                              !pastSessionMaterialDesc.trim() ||
                              !pastSessionMaterialCost
                            )
                              return
                            setPastSessionMaterialSaved(true)
                            setShowPastSessionMaterialEditor(false)
                          }}
                          disabled={
                            !pastSessionMaterialDesc.trim() ||
                            !pastSessionMaterialCost
                          }
                          className="flex-1 flex items-center justify-center gap-1.5 bg-emerald-600 text-white rounded-lg py-2.5 text-xs font-mono font-bold uppercase tracking-wider active:scale-95 transition-all disabled:opacity-50"
                        >
                          <CheckIcon className="w-4 h-4" /> Save Material
                        </button>
                        <button
                          onClick={() => {
                            setShowPastSessionMaterialEditor(false)
                            setPastSessionMaterialDesc('')
                            setPastSessionMaterialCost('')
                          }}
                          className="flex items-center justify-center gap-1.5 bg-white text-navy border border-navy/10 rounded-lg py-2.5 px-4 text-xs font-mono font-bold uppercase tracking-wider active:scale-95 transition-all"
                        >
                          <XIcon className="w-4 h-4" /> Discard
                        </button>
                      </>
                    ) : showPastSessionNoteEditor ? (
                      <>
                        <button
                          onClick={() => {
                            if (!pastSessionNoteBody.trim()) return
                            setPastSessionNoteSaved(true)
                            setShowPastSessionNoteEditor(false)
                          }}
                          disabled={!pastSessionNoteBody.trim()}
                          className="flex-1 flex items-center justify-center gap-1.5 bg-amber-600 text-white rounded-lg py-2.5 text-xs font-mono font-bold uppercase tracking-wider active:scale-95 transition-all disabled:opacity-50"
                        >
                          <CheckIcon className="w-4 h-4" /> Save Note
                        </button>
                        <button
                          onClick={() => {
                            setShowPastSessionNoteEditor(false)
                            setPastSessionNoteBody('')
                          }}
                          className="flex items-center justify-center gap-1.5 bg-white text-navy border border-navy/10 rounded-lg py-2.5 px-4 text-xs font-mono font-bold uppercase tracking-wider active:scale-95 transition-all"
                        >
                          <XIcon className="w-4 h-4" /> Discard
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => {
                            if (!pastSessionStart || !pastSessionEnd) return
                            const newSessionId = `s_${Date.now()}`
                            onAddPastSession(
                              job.id,
                              new Date(pastSessionStart).toISOString(),
                              new Date(pastSessionEnd).toISOString(),
                              null,
                              newSessionId,
                            )
                            if (
                              pastSessionNoteSaved &&
                              pastSessionNoteBody.trim() &&
                              onAddNote
                            ) {
                              onAddNote(job.id, {
                                job_id: job.id,
                                session_id: newSessionId,
                                body: pastSessionNoteBody.trim(),
                              })
                            }
                            if (
                              pastSessionMaterialSaved &&
                              pastSessionMaterialDesc.trim() &&
                              pastSessionMaterialCost &&
                              onAddMaterial
                            ) {
                              onAddMaterial(job.id, {
                                job_id: job.id,
                                session_id: newSessionId,
                                description: pastSessionMaterialDesc.trim(),
                                total_cost: parseFloat(pastSessionMaterialCost),
                                quantity:
                                  parseFloat(pastSessionMaterialQty) || 1,
                                unit: pastSessionMaterialUnit,
                              })
                            }
                            setShowAddPastSession(false)
                            setShowAddSessionMenu(false)
                            setPastSessionNoteBody('')
                            setPastSessionNoteSaved(false)
                            setShowPastSessionNoteEditor(false)
                            setPastSessionMaterialDesc('')
                            setPastSessionMaterialCost('')
                            setPastSessionMaterialQty('1')
                            setPastSessionMaterialUnit('ea')
                            setPastSessionMaterialSaved(false)
                            setShowPastSessionMaterialEditor(false)
                          }}
                          disabled={!pastSessionStart || !pastSessionEnd}
                          className="flex-1 flex items-center justify-center gap-1.5 bg-emerald-600 text-white rounded-lg py-2.5 text-xs font-mono font-bold uppercase tracking-wider active:scale-95 transition-all disabled:opacity-50"
                        >
                          <CheckIcon className="w-4 h-4" /> Save Session
                        </button>
                        <button
                          onClick={() => {
                            setShowAddPastSession(false)
                            setShowAddSessionMenu(false)
                            setPastSessionNoteBody('')
                            setPastSessionNoteSaved(false)
                            setShowPastSessionNoteEditor(false)
                            setPastSessionMaterialDesc('')
                            setPastSessionMaterialCost('')
                            setPastSessionMaterialQty('1')
                            setPastSessionMaterialUnit('ea')
                            setPastSessionMaterialSaved(false)
                            setShowPastSessionMaterialEditor(false)
                          }}
                          className="flex items-center justify-center gap-1.5 bg-white text-navy border border-navy/10 rounded-lg py-2.5 px-4 text-xs font-mono font-bold uppercase tracking-wider active:scale-95 transition-all"
                        >
                          <XIcon className="w-4 h-4" /> Cancel
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="bg-white rounded-2xl border border-navy/10 shadow-sm divide-y divide-navy/5 overflow-hidden">
            {job.sessions.map((session) => {
              const isExpanded = expandedSessionId === session.id
              const isEditing = editingSessionId === session.id
              return (
                <div key={session.id}>
                  <div
                    onClick={() => toggleSessionExpand(session.id)}
                    className="p-4 flex justify-between items-center cursor-pointer hover:bg-[#F0EBE3]/50 transition-colors"
                  >
                    <div>
                      <div className="font-mono font-bold text-navy">
                        {formatSessionDate(session.started_at)}
                      </div>
                      <div className="text-sm font-mono text-warm-gray mt-0.5">
                        {formatSessionTime(session.started_at)} –{' '}
                        {session.ended_at
                          ? formatSessionTime(session.ended_at)
                          : 'Ongoing'}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="font-mono font-bold tabular-nums text-lg text-navy">
                        {formatSessionDuration(session)}
                      </div>
                      {isExpanded ? (
                        <ChevronUpIcon className="w-5 h-5 text-warm-gray" />
                      ) : (
                        <ChevronDownIcon className="w-5 h-5 text-warm-gray" />
                      )}
                    </div>
                  </div>

                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{
                          height: 0,
                          opacity: 0,
                        }}
                        animate={{
                          height: 'auto',
                          opacity: 1,
                        }}
                        exit={{
                          height: 0,
                          opacity: 0,
                        }}
                        transition={{
                          duration: 0.2,
                        }}
                        className="overflow-hidden"
                      >
                        <div className="px-4 pb-4 pt-2 bg-[#F0EBE3]/30 border-t border-navy/5">
                          {!isEditing ? (
                            <>
                              {(() => {
                                const sessionNotes = job.notes.filter((n) =>
                                  isItemInSession(n, session),
                                )
                                const sessionMaterials = job.materials.filter(
                                  (m) => isItemInSession(m, session),
                                )
                                const hasAttachments =
                                  sessionNotes.length > 0 ||
                                  sessionMaterials.length > 0
                                return hasAttachments ? (
                                  <div className="space-y-2 mb-4">
                                    {sessionNotes.map((note) => (
                                      <div
                                        key={note.id}
                                        className="flex items-start gap-2.5 bg-white rounded-lg border border-navy/5 p-3"
                                      >
                                        <FileTextIcon className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                                        <div className="font-mono text-sm text-navy leading-snug">
                                          {note.body.length > 80
                                            ? note.body.substring(0, 80) + '…'
                                            : note.body}
                                        </div>
                                      </div>
                                    ))}
                                    {sessionMaterials.map((mat) => (
                                      <div
                                        key={mat.id}
                                        className="flex items-center gap-2.5 bg-white rounded-lg border border-navy/5 p-3"
                                      >
                                        <WrenchIcon className="w-4 h-4 text-emerald-600 shrink-0" />
                                        <div className="flex-1 font-mono text-sm text-navy">
                                          {mat.description || 'Material'}
                                        </div>
                                        <div className="font-mono font-bold text-sm text-navy">
                                          ${mat.total_cost.toFixed(2)}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <div className="text-center py-3 mb-3">
                                    <p className="font-mono text-xs text-warm-gray italic">
                                      No notes, materials, or photos yet
                                    </p>
                                  </div>
                                )
                              })()}
                              <div className="mb-4">
                                <div className="text-[10px] font-mono font-bold text-warm-gray uppercase tracking-wider mb-2">
                                  Add to Session
                                </div>
                                <div className="grid grid-cols-4 gap-2">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      setShowAddPhotoInline(true)
                                      setNewPhotoFileName('')
                                      setNewPhotoCaption('')
                                      setNewPhotoSessionId(session.id)
                                    }}
                                    className="bg-white rounded-xl border border-navy/10 py-2.5 flex flex-col items-center justify-center gap-1.5 active:scale-95 transition-all"
                                  >
                                    <CameraIcon className="w-4 h-4 text-blue-600" />
                                    <span className="font-mono font-bold uppercase tracking-wider text-[8px] text-navy">
                                      Photo
                                    </span>
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      if (inlineNoteSessionId === session.id) {
                                        setInlineNoteSessionId(null)
                                        setInlineNoteBody('')
                                      } else {
                                        setInlineNoteSessionId(session.id)
                                        setInlineNoteBody('')
                                        setInlineNoteSavedSessionId(null)
                                      }
                                    }}
                                    className={`rounded-xl border py-2.5 flex flex-col items-center justify-center gap-1.5 active:scale-95 transition-all ${inlineNoteSessionId === session.id ? 'bg-amber-50 border-amber-300' : 'bg-white border-navy/10'}`}
                                  >
                                    <FileTextIcon className="w-4 h-4 text-amber-600" />
                                    <span className="font-mono font-bold uppercase tracking-wider text-[8px] text-navy">
                                      Note
                                    </span>
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      setShowAddVoiceInline(true)
                                      setNewVoiceTranscription('')
                                      setNewVoiceSessionId(session.id)
                                    }}
                                    className="bg-white rounded-xl border border-navy/10 py-2.5 flex flex-col items-center justify-center gap-1.5 active:scale-95 transition-all"
                                  >
                                    <MicIcon className="w-4 h-4 text-purple-600" />
                                    <span className="font-mono font-bold uppercase tracking-wider text-[8px] text-navy">
                                      Voice
                                    </span>
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      if (
                                        inlineMaterialSessionId === session.id
                                      ) {
                                        setInlineMaterialSessionId(null)
                                        setInlineMaterialDesc('')
                                        setInlineMaterialCost('')
                                      } else {
                                        setInlineMaterialSessionId(session.id)
                                        setInlineMaterialDesc('')
                                        setInlineMaterialCost('')
                                        setInlineMaterialQty('1')
                                        setInlineMaterialUnit('ea')
                                        setInlineMaterialSavedSessionId(null)
                                      }
                                    }}
                                    className={`rounded-xl border py-2.5 flex flex-col items-center justify-center gap-1.5 active:scale-95 transition-all ${inlineMaterialSessionId === session.id ? 'bg-emerald-50 border-emerald-300' : 'bg-white border-navy/10'}`}
                                  >
                                    <WrenchIcon className="w-4 h-4 text-emerald-600" />
                                    <span className="font-mono font-bold uppercase tracking-wider text-[8px] text-navy">
                                      Material
                                    </span>
                                  </button>
                                </div>
                              </div>

                              {/* Inline note editor for existing session */}
                              <AnimatePresence>
                                {inlineNoteSessionId === session.id && (
                                  <motion.div
                                    initial={{
                                      height: 0,
                                      opacity: 0,
                                    }}
                                    animate={{
                                      height: 'auto',
                                      opacity: 1,
                                    }}
                                    exit={{
                                      height: 0,
                                      opacity: 0,
                                    }}
                                    transition={{
                                      duration: 0.2,
                                    }}
                                    className="overflow-hidden mb-3"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <div className="bg-amber-50/60 rounded-xl border border-amber-200/60 p-3">
                                      <div className="flex items-center gap-1.5 mb-2">
                                        <FileTextIcon className="w-3.5 h-3.5 text-amber-600" />
                                        <span className="text-[10px] font-mono font-bold text-amber-700 uppercase tracking-wider">
                                          Note for this session
                                        </span>
                                      </div>
                                      <textarea
                                        value={inlineNoteBody}
                                        onChange={(e) =>
                                          setInlineNoteBody(e.target.value)
                                        }
                                        placeholder="What happened? Observations, measurements, next steps..."
                                        rows={3}
                                        autoFocus
                                        className="w-full bg-white text-navy border border-amber-200/60 rounded-lg px-3 py-2 font-mono text-sm leading-relaxed focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/20 placeholder:text-warm-gray/40 resize-none"
                                      />
                                    </div>
                                  </motion.div>
                                )}
                              </AnimatePresence>

                              {/* Saved note confirmation chip */}
                              <AnimatePresence>
                                {inlineNoteSavedSessionId === session.id &&
                                  inlineNoteSessionId !== session.id && (
                                    <motion.div
                                      initial={{
                                        opacity: 0,
                                        y: -4,
                                      }}
                                      animate={{
                                        opacity: 1,
                                        y: 0,
                                      }}
                                      exit={{
                                        opacity: 0,
                                      }}
                                      className="mb-3 flex items-center gap-2 bg-amber-50 border border-amber-200/60 rounded-lg px-3 py-2"
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      <CheckIcon className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                                      <span className="font-mono text-xs text-amber-700 flex-1">
                                        Note saved to this session
                                      </span>
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          setInlineNoteSessionId(session.id)
                                        }}
                                        className="text-[10px] font-mono font-bold text-amber-600 uppercase tracking-wider"
                                      >
                                        Add Another
                                      </button>
                                    </motion.div>
                                  )}
                              </AnimatePresence>

                              {/* Inline material editor for existing session */}
                              <AnimatePresence>
                                {inlineMaterialSessionId === session.id && (
                                  <motion.div
                                    initial={{
                                      height: 0,
                                      opacity: 0,
                                    }}
                                    animate={{
                                      height: 'auto',
                                      opacity: 1,
                                    }}
                                    exit={{
                                      height: 0,
                                      opacity: 0,
                                    }}
                                    transition={{
                                      duration: 0.2,
                                    }}
                                    className="overflow-hidden mb-3"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <div className="bg-emerald-50/60 rounded-xl border border-emerald-200/60 p-3">
                                      <div className="flex items-center gap-1.5 mb-2">
                                        <WrenchIcon className="w-3.5 h-3.5 text-emerald-600" />
                                        <span className="text-[10px] font-mono font-bold text-emerald-700 uppercase tracking-wider">
                                          Material for this session
                                        </span>
                                      </div>
                                      <div className="space-y-2">
                                        <input
                                          value={inlineMaterialDesc}
                                          onChange={(e) =>
                                            setInlineMaterialDesc(
                                              e.target.value,
                                            )
                                          }
                                          placeholder='e.g. Copper Pipe 1/2"'
                                          autoFocus
                                          className="w-full bg-white text-navy border border-emerald-200/60 rounded-lg px-3 py-2 font-mono text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 placeholder:text-warm-gray/40"
                                        />
                                        <div className="flex gap-2">
                                          <div className="relative flex-1">
                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono font-bold text-warm-gray text-sm">
                                              $
                                            </span>
                                            <input
                                              type="number"
                                              value={inlineMaterialCost}
                                              onChange={(e) =>
                                                setInlineMaterialCost(
                                                  e.target.value,
                                                )
                                              }
                                              placeholder="0.00"
                                              step="0.01"
                                              className="w-full bg-white text-navy border border-emerald-200/60 rounded-lg pl-7 pr-3 py-2 font-mono text-sm tabular-nums focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 placeholder:text-warm-gray/40"
                                            />
                                          </div>
                                          <input
                                            type="number"
                                            value={inlineMaterialQty}
                                            onChange={(e) =>
                                              setInlineMaterialQty(
                                                e.target.value,
                                              )
                                            }
                                            placeholder="Qty"
                                            className="w-14 bg-white text-navy border border-emerald-200/60 rounded-lg px-2 py-2 font-mono text-sm text-center focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20"
                                          />
                                          <div className="relative">
                                            <select
                                              value={inlineMaterialUnit}
                                              onChange={(e) =>
                                                setInlineMaterialUnit(
                                                  e.target.value,
                                                )
                                              }
                                              className="bg-white text-navy border border-emerald-200/60 rounded-lg px-2 py-2 font-mono text-sm focus:outline-none focus:border-emerald-500 appearance-none pr-6"
                                            >
                                              {[
                                                'ea',
                                                'ft',
                                                'pcs',
                                                'kit',
                                                'lot',
                                                'gal',
                                                'lb',
                                              ].map((u) => (
                                                <option key={u} value={u}>
                                                  {u}
                                                </option>
                                              ))}
                                            </select>
                                            <div className="absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none text-warm-gray text-[10px]">
                                              ▼
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  </motion.div>
                                )}
                              </AnimatePresence>

                              {/* Saved material confirmation chip */}
                              <AnimatePresence>
                                {inlineMaterialSavedSessionId === session.id &&
                                  inlineMaterialSessionId !== session.id && (
                                    <motion.div
                                      initial={{
                                        opacity: 0,
                                        y: -4,
                                      }}
                                      animate={{
                                        opacity: 1,
                                        y: 0,
                                      }}
                                      exit={{
                                        opacity: 0,
                                      }}
                                      className="mb-3 flex items-center gap-2 bg-emerald-50 border border-emerald-200/60 rounded-lg px-3 py-2"
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      <CheckIcon className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                      <span className="font-mono text-xs text-emerald-700 flex-1">
                                        Material saved to this session
                                      </span>
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          setInlineMaterialSessionId(session.id)
                                          setInlineMaterialDesc('')
                                          setInlineMaterialCost('')
                                          setInlineMaterialQty('1')
                                          setInlineMaterialUnit('ea')
                                        }}
                                        className="text-[10px] font-mono font-bold text-emerald-600 uppercase tracking-wider"
                                      >
                                        Add Another
                                      </button>
                                    </motion.div>
                                  )}
                              </AnimatePresence>

                              <div className="flex gap-2">
                                {inlineMaterialSessionId === session.id ? (
                                  <>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        if (
                                          !inlineMaterialDesc.trim() ||
                                          !inlineMaterialCost
                                        )
                                          return
                                        if (onAddMaterial) {
                                          onAddMaterial(job.id, {
                                            job_id: job.id,
                                            session_id: session.id,
                                            description:
                                              inlineMaterialDesc.trim(),
                                            total_cost:
                                              parseFloat(inlineMaterialCost),
                                            quantity:
                                              parseFloat(inlineMaterialQty) ||
                                              1,
                                            unit: inlineMaterialUnit,
                                          })
                                        }
                                        setInlineMaterialSavedSessionId(
                                          session.id,
                                        )
                                        setInlineMaterialSessionId(null)
                                        setInlineMaterialDesc('')
                                        setInlineMaterialCost('')
                                        setInlineMaterialQty('1')
                                        setInlineMaterialUnit('ea')
                                      }}
                                      disabled={
                                        !inlineMaterialDesc.trim() ||
                                        !inlineMaterialCost
                                      }
                                      className="flex-1 flex items-center justify-center gap-1.5 bg-emerald-600 text-white rounded-lg py-2 text-xs font-mono font-bold uppercase tracking-wider active:scale-95 transition-all disabled:opacity-50"
                                    >
                                      <CheckIcon className="w-3.5 h-3.5" /> Save
                                      Material
                                    </button>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        setInlineMaterialSessionId(null)
                                        setInlineMaterialDesc('')
                                        setInlineMaterialCost('')
                                      }}
                                      className="flex items-center justify-center gap-1.5 bg-white text-navy border border-navy/10 rounded-lg py-2 px-4 text-xs font-mono font-bold uppercase tracking-wider active:scale-95 transition-all"
                                    >
                                      <XIcon className="w-3.5 h-3.5" /> Discard
                                    </button>
                                  </>
                                ) : inlineNoteSessionId === session.id ? (
                                  <>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        if (!inlineNoteBody.trim()) return
                                        if (onAddNote) {
                                          onAddNote(job.id, {
                                            job_id: job.id,
                                            session_id: session.id,
                                            body: inlineNoteBody.trim(),
                                          })
                                        }
                                        setInlineNoteSavedSessionId(session.id)
                                        setInlineNoteSessionId(null)
                                        setInlineNoteBody('')
                                      }}
                                      disabled={!inlineNoteBody.trim()}
                                      className="flex-1 flex items-center justify-center gap-1.5 bg-amber-600 text-white rounded-lg py-2 text-xs font-mono font-bold uppercase tracking-wider active:scale-95 transition-all disabled:opacity-50"
                                    >
                                      <CheckIcon className="w-3.5 h-3.5" /> Save
                                      Note
                                    </button>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        setInlineNoteSessionId(null)
                                        setInlineNoteBody('')
                                      }}
                                      className="flex items-center justify-center gap-1.5 bg-white text-navy border border-navy/10 rounded-lg py-2 px-4 text-xs font-mono font-bold uppercase tracking-wider active:scale-95 transition-all"
                                    >
                                      <XIcon className="w-3.5 h-3.5" /> Discard
                                    </button>
                                  </>
                                ) : (
                                  <>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        handleStartEditSession(session)
                                      }}
                                      className="flex-1 flex items-center justify-center gap-1.5 bg-white text-navy border border-navy/10 rounded-lg py-2 text-xs font-mono font-bold uppercase tracking-wider active:scale-95 transition-all"
                                    >
                                      <PencilIcon className="w-3.5 h-3.5" />{' '}
                                      Edit
                                    </button>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        onDeleteSession(session.id)
                                      }}
                                      className="flex items-center justify-center gap-1.5 bg-white text-field-red border border-field-red/20 rounded-lg py-2 px-4 text-xs font-mono font-bold uppercase tracking-wider active:scale-95 transition-all"
                                    >
                                      <Trash2Icon className="w-3.5 h-3.5" />{' '}
                                      Delete
                                    </button>
                                  </>
                                )}
                              </div>
                            </>
                          ) : (
                            <>
                              <div className="space-y-3 mb-4">
                                <div>
                                  <label className="block text-[10px] font-mono font-bold text-warm-gray uppercase tracking-wider mb-1">
                                    Start Time
                                  </label>
                                  <input
                                    type="datetime-local"
                                    value={editSessionStart}
                                    onChange={(e) =>
                                      setEditSessionStart(e.target.value)
                                    }
                                    onClick={(e) => e.stopPropagation()}
                                    className="w-full bg-white text-navy border border-navy/10 rounded-lg px-3 py-2 font-mono text-sm focus:outline-none focus:border-field-red focus:ring-1 focus:ring-field-red/20"
                                  />
                                </div>
                                <div>
                                  <label className="block text-[10px] font-mono font-bold text-warm-gray uppercase tracking-wider mb-1">
                                    End Time
                                  </label>
                                  <input
                                    type="datetime-local"
                                    value={editSessionEnd}
                                    onChange={(e) =>
                                      setEditSessionEnd(e.target.value)
                                    }
                                    onClick={(e) => e.stopPropagation()}
                                    className="w-full bg-white text-navy border border-navy/10 rounded-lg px-3 py-2 font-mono text-sm focus:outline-none focus:border-field-red focus:ring-1 focus:ring-field-red/20"
                                  />
                                </div>
                              </div>
                              <div className="flex gap-2">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleSaveSession(session.id)
                                  }}
                                  className="flex-1 flex items-center justify-center gap-1.5 bg-emerald-600 text-white rounded-lg py-2 text-xs font-mono font-bold uppercase tracking-wider active:scale-95 transition-all"
                                >
                                  <CheckIcon className="w-4 h-4" /> Save
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleCancelEditSession()
                                  }}
                                  className="flex-1 flex items-center justify-center gap-1.5 bg-white text-navy border border-navy/10 rounded-lg py-2 text-xs font-mono font-bold uppercase tracking-wider active:scale-95 transition-all"
                                >
                                  <XIcon className="w-4 h-4" /> Cancel
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )
            })}
            {job.sessions.length === 0 && (
              <div className="p-6 text-center font-mono text-warm-gray text-sm">
                No sessions recorded.
              </div>
            )}
          </div>
        </section>

        {/* Materials Section */}
        <section>
          <div className="flex justify-between items-center mb-4 border-b border-navy/10 pb-2">
            <h2 className="text-sm font-mono font-bold text-accent-red flex items-center uppercase tracking-wider">
              <WrenchIcon className="w-4 h-4 mr-2" />
              Materials
            </h2>
            <button
              onClick={() => {
                setShowAddMaterialInline(true)
                setNewMaterialDesc('')
                setNewMaterialCost('')
                setNewMaterialQty('1')
                setNewMaterialUnit('ea')
                setNewMaterialSessionId(null)
              }}
              className="text-xs font-mono font-bold text-field-red uppercase tracking-wider bg-field-red/10 px-3 py-1 rounded-full"
            >
              + Add
            </button>
          </div>

          <AnimatePresence>
            {showAddMaterialInline && (
              <motion.div
                initial={{
                  height: 0,
                  opacity: 0,
                }}
                animate={{
                  height: 'auto',
                  opacity: 1,
                }}
                exit={{
                  height: 0,
                  opacity: 0,
                }}
                transition={{
                  duration: 0.2,
                }}
                className="overflow-hidden mb-4"
              >
                <div className="bg-white rounded-2xl border border-navy/10 shadow-sm p-4">
                  <div className="text-xs font-mono font-bold text-navy uppercase tracking-wider mb-4 flex items-center gap-2">
                    <WrenchIcon className="w-3.5 h-3.5 text-emerald-600" />
                    New Material
                  </div>
                  <div className="space-y-3 mb-4">
                    <input
                      value={newMaterialDesc}
                      onChange={(e) => setNewMaterialDesc(e.target.value)}
                      placeholder='e.g. Copper Pipe 1/2"'
                      autoFocus
                      className="w-full bg-cream text-navy border border-navy/10 rounded-lg px-3 py-2.5 font-mono text-sm focus:outline-none focus:border-field-red focus:ring-1 focus:ring-field-red/20 placeholder:text-warm-gray/40"
                    />
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono font-bold text-warm-gray text-sm">
                          $
                        </span>
                        <input
                          type="number"
                          value={newMaterialCost}
                          onChange={(e) => setNewMaterialCost(e.target.value)}
                          placeholder="0.00"
                          step="0.01"
                          className="w-full bg-cream text-navy border border-navy/10 rounded-lg pl-7 pr-3 py-2.5 font-mono text-sm tabular-nums focus:outline-none focus:border-field-red focus:ring-1 focus:ring-field-red/20 placeholder:text-warm-gray/40"
                        />
                      </div>
                      <input
                        type="number"
                        value={newMaterialQty}
                        onChange={(e) => setNewMaterialQty(e.target.value)}
                        placeholder="Qty"
                        className="w-16 bg-cream text-navy border border-navy/10 rounded-lg px-3 py-2.5 font-mono text-sm text-center focus:outline-none focus:border-field-red focus:ring-1 focus:ring-field-red/20"
                      />
                      <div className="relative">
                        <select
                          value={newMaterialUnit}
                          onChange={(e) => setNewMaterialUnit(e.target.value)}
                          className="bg-cream text-navy border border-navy/10 rounded-lg px-3 py-2.5 font-mono text-sm focus:outline-none focus:border-field-red focus:ring-1 focus:ring-field-red/20 appearance-none pr-7"
                        >
                          {['ea', 'ft', 'pcs', 'kit', 'lot', 'gal', 'lb'].map(
                            (u) => (
                              <option key={u} value={u}>
                                {u}
                              </option>
                            ),
                          )}
                        </select>
                        <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-warm-gray text-xs">
                          ▼
                        </div>
                      </div>
                    </div>
                    {job.sessions.length > 0 && (
                      <div className="relative">
                        <select
                          value={newMaterialSessionId || ''}
                          onChange={(e) =>
                            setNewMaterialSessionId(e.target.value || null)
                          }
                          className="w-full bg-cream text-navy border border-navy/10 rounded-lg px-3 py-2.5 font-mono text-sm focus:outline-none focus:border-field-red focus:ring-1 focus:ring-field-red/20 appearance-none"
                        >
                          <option value="">No session (general)</option>
                          {job.sessions.map((s) => (
                            <option key={s.id} value={s.id}>
                              {formatSessionLabel(s)}
                            </option>
                          ))}
                        </select>
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-warm-gray text-xs">
                          ▼
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        if (!newMaterialDesc || !newMaterialCost) return
                        const qty = parseFloat(newMaterialQty) || 1
                        const cost = parseFloat(newMaterialCost)
                        if (onAddMaterial) {
                          onAddMaterial(job.id, {
                            job_id: job.id,
                            session_id: newMaterialSessionId,
                            description: newMaterialDesc,
                            quantity: qty,
                            unit: newMaterialUnit,
                            unit_cost: cost / qty,
                            total_cost: cost,
                            purchase_date: new Date()
                              .toISOString()
                              .split('T')[0],
                          })
                        }
                        setShowAddMaterialInline(false)
                      }}
                      disabled={!newMaterialDesc || !newMaterialCost}
                      className="flex-1 flex items-center justify-center gap-1.5 bg-emerald-600 text-white rounded-lg py-2.5 text-xs font-mono font-bold uppercase tracking-wider active:scale-95 transition-all disabled:opacity-50"
                    >
                      <CheckIcon className="w-4 h-4" /> Save
                    </button>
                    <button
                      onClick={() => setShowAddMaterialInline(false)}
                      className="flex items-center justify-center gap-1.5 bg-white text-navy border border-navy/10 rounded-lg py-2.5 px-4 text-xs font-mono font-bold uppercase tracking-wider active:scale-95 transition-all"
                    >
                      <XIcon className="w-4 h-4" /> Cancel
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="bg-white rounded-2xl border border-navy/10 shadow-sm divide-y divide-navy/5 overflow-hidden">
            {(() => {
              const unassignedMaterials = job.materials.filter(
                (m) => !job.sessions.some((s) => isItemInSession(m, s)),
              )
              const sessionGroups = job.sessions
                .map((session) => ({
                  session,
                  materials: job.materials.filter((m) =>
                    isItemInSession(m, session),
                  ),
                }))
                .filter((g) => g.materials.length > 0)
              if (job.materials.length === 0) {
                return (
                  <div className="p-6 text-center">
                    {job.no_materials_confirmed ? (
                      <div className="flex flex-col items-center gap-2">
                        <div className="flex items-center gap-1.5 text-emerald-600">
                          <CheckIcon className="w-4 h-4" />
                          <span className="font-mono font-bold text-sm">
                            No materials used
                          </span>
                        </div>
                        <button
                          onClick={() =>
                            onUpdateJob({
                              id: job.id,
                              no_materials_confirmed: false,
                            })
                          }
                          className="font-mono text-xs text-warm-gray underline underline-offset-2 hover:text-navy transition-colors"
                        >
                          Undo
                        </button>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-3">
                        <p className="font-mono text-warm-gray text-sm">
                          No materials recorded.
                        </p>
                        <button
                          onClick={() =>
                            onUpdateJob({
                              id: job.id,
                              no_materials_confirmed: true,
                            })
                          }
                          className="font-mono text-xs font-bold text-navy bg-[#F0EBE3] border border-navy/10 rounded-full px-4 py-2 active:scale-95 transition-all hover:shadow-sm"
                        >
                          Confirm no materials used
                        </button>
                      </div>
                    )}
                  </div>
                )
              }
              function renderMaterialRow(material: any) {
                const isEditingMat = editingMaterialId === material.id
                if (isEditingMat) {
                  return (
                    <div key={material.id} className="p-4 bg-cream/50">
                      <div className="space-y-3 mb-3">
                        <input
                          value={editMaterialDesc}
                          onChange={(e) => setEditMaterialDesc(e.target.value)}
                          placeholder="Description"
                          className="w-full bg-white text-navy border border-navy/10 rounded-lg px-3 py-2 font-mono text-sm focus:outline-none focus:border-field-red focus:ring-1 focus:ring-field-red/20"
                        />
                        <div className="flex gap-2">
                          <input
                            type="number"
                            value={editMaterialQty}
                            onChange={(e) => setEditMaterialQty(e.target.value)}
                            placeholder="Qty"
                            className="w-16 bg-white text-navy border border-navy/10 rounded-lg px-3 py-2 font-mono text-sm text-center focus:outline-none focus:border-field-red focus:ring-1 focus:ring-field-red/20"
                          />
                          <div className="relative">
                            <select
                              value={editMaterialUnit}
                              onChange={(e) =>
                                setEditMaterialUnit(e.target.value)
                              }
                              className="bg-white text-navy border border-navy/10 rounded-lg px-2 py-2 font-mono text-sm focus:outline-none focus:border-field-red appearance-none pr-6"
                            >
                              {[
                                'ea',
                                'ft',
                                'pcs',
                                'kit',
                                'lot',
                                'gal',
                                'lb',
                              ].map((u) => (
                                <option key={u} value={u}>
                                  {u}
                                </option>
                              ))}
                            </select>
                            <div className="absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none text-warm-gray text-[10px]">
                              ▼
                            </div>
                          </div>
                          <div className="relative flex-1">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono font-bold text-warm-gray">
                              $
                            </span>
                            <input
                              type="number"
                              value={editMaterialCost}
                              onChange={(e) =>
                                setEditMaterialCost(e.target.value)
                              }
                              placeholder="Unit Cost"
                              className="w-full bg-white text-navy border border-navy/10 rounded-lg pl-7 pr-3 py-2 font-mono text-sm focus:outline-none focus:border-field-red focus:ring-1 focus:ring-field-red/20"
                            />
                          </div>
                        </div>
                        {job.sessions.length > 0 && (
                          <div className="relative">
                            <select
                              value={editMaterialSessionId || ''}
                              onChange={(e) =>
                                setEditMaterialSessionId(e.target.value || null)
                              }
                              className="w-full bg-white text-navy border border-navy/10 rounded-lg px-3 py-2 font-mono text-sm focus:outline-none focus:border-field-red focus:ring-1 focus:ring-field-red/20 appearance-none"
                            >
                              <option value="">No session (general)</option>
                              {job.sessions.map((s) => (
                                <option key={s.id} value={s.id}>
                                  {formatSessionLabel(s)}
                                </option>
                              ))}
                            </select>
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-warm-gray text-xs">
                              ▼
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            if (onUpdateMaterial) {
                              const qty = parseFloat(editMaterialQty) || 1
                              const cost = parseFloat(editMaterialCost) || 0
                              onUpdateMaterial(material.id, {
                                description: editMaterialDesc,
                                quantity: qty,
                                unit: editMaterialUnit,
                                unit_cost: cost,
                                total_cost: qty * cost,
                                session_id: editMaterialSessionId,
                              })
                            }
                            setEditingMaterialId(null)
                          }}
                          className="flex-1 flex items-center justify-center gap-1.5 bg-emerald-600 text-white rounded-lg py-2 text-xs font-mono font-bold uppercase tracking-wider active:scale-95 transition-all"
                        >
                          <CheckIcon className="w-4 h-4" /> Save
                        </button>
                        <button
                          onClick={() => setEditingMaterialId(null)}
                          className="flex-1 flex items-center justify-center gap-1.5 bg-white text-navy border border-navy/10 rounded-lg py-2 text-xs font-mono font-bold uppercase tracking-wider active:scale-95 transition-all"
                        >
                          <XIcon className="w-4 h-4" /> Cancel
                        </button>
                        <button
                          onClick={() => {
                            if (onDeleteMaterial) onDeleteMaterial(material.id)
                            setEditingMaterialId(null)
                          }}
                          className="flex items-center justify-center bg-white text-field-red border border-field-red/20 rounded-lg px-3 py-2 active:scale-95 transition-all"
                        >
                          <Trash2Icon className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )
                }
                return (
                  <div
                    key={material.id}
                    onClick={() => {
                      setEditingMaterialId(material.id)
                      setEditMaterialDesc(material.description || '')
                      setEditMaterialQty(String(material.quantity || 1))
                      setEditMaterialUnit(material.unit || 'ea')
                      setEditMaterialCost(
                        String(material.unit_cost || material.total_cost || 0),
                      )
                      setEditMaterialSessionId(material.session_id || null)
                    }}
                    className="p-4 flex justify-between items-center cursor-pointer hover:bg-[#F0EBE3]/50 transition-colors"
                  >
                    <div>
                      <div className="font-mono font-bold text-navy">
                        {material.description || 'Unnamed material'}
                      </div>
                      <div className="text-sm font-mono text-warm-gray mt-0.5">
                        {material.quantity && material.unit
                          ? `${material.quantity} ${material.unit}`
                          : `Qty: ${material.quantity || 1}`}
                      </div>
                    </div>
                    <div className="font-mono font-bold tabular-nums text-lg text-navy">
                      ${material.total_cost.toFixed(2)}
                    </div>
                  </div>
                )
              }
              return (
                <>
                  {unassignedMaterials.length > 0 && (
                    <div>
                      <div className="bg-[#F0EBE3]/50 text-xs font-mono font-bold text-warm-gray uppercase tracking-wider px-4 py-2">
                        Unassigned
                      </div>
                      {unassignedMaterials.map((material) =>
                        renderMaterialRow(material),
                      )}
                    </div>
                  )}
                  {sessionGroups.map((group) => (
                    <div key={group.session.id}>
                      <div className="bg-[#F0EBE3]/50 text-xs font-mono font-bold text-warm-gray uppercase tracking-wider px-4 py-2">
                        {formatSessionDate(group.session.started_at)} Session
                      </div>
                      {group.materials.map((material) =>
                        renderMaterialRow(material),
                      )}
                    </div>
                  ))}
                </>
              )
            })()}
          </div>
        </section>

        {/* Notes Section */}
        <section>
          <div className="flex justify-between items-center mb-4 border-b border-navy/10 pb-2">
            <h2 className="text-sm font-mono font-bold text-accent-red flex items-center uppercase tracking-wider">
              <FileTextIcon className="w-4 h-4 mr-2" />
              Notes
            </h2>
            <button
              onClick={() => {
                setShowAddNoteInline(true)
                setNewNoteBody('')
                setNewNoteSessionId(null)
              }}
              className="text-xs font-mono font-bold text-field-red uppercase tracking-wider bg-field-red/10 px-3 py-1 rounded-full"
            >
              + Add
            </button>
          </div>

          <AnimatePresence>
            {showAddNoteInline && (
              <motion.div
                initial={{
                  height: 0,
                  opacity: 0,
                }}
                animate={{
                  height: 'auto',
                  opacity: 1,
                }}
                exit={{
                  height: 0,
                  opacity: 0,
                }}
                transition={{
                  duration: 0.2,
                }}
                className="overflow-hidden mb-4"
              >
                <div className="bg-white rounded-2xl border border-navy/10 shadow-sm p-4">
                  <div className="text-xs font-mono font-bold text-navy uppercase tracking-wider mb-4 flex items-center gap-2">
                    <FileTextIcon className="w-3.5 h-3.5 text-amber-600" />
                    New Note
                  </div>
                  <div className="space-y-3 mb-4">
                    <textarea
                      value={newNoteBody}
                      onChange={(e) => setNewNoteBody(e.target.value)}
                      placeholder="What happened on site today?"
                      rows={3}
                      autoFocus
                      className="w-full bg-cream text-navy border border-navy/10 rounded-lg px-3 py-2.5 font-mono text-sm focus:outline-none focus:border-field-red focus:ring-1 focus:ring-field-red/20 placeholder:text-warm-gray/40 resize-none"
                    />
                    {job.sessions.length > 0 && (
                      <div className="relative">
                        <select
                          value={newNoteSessionId || ''}
                          onChange={(e) =>
                            setNewNoteSessionId(e.target.value || null)
                          }
                          className="w-full bg-cream text-navy border border-navy/10 rounded-lg px-3 py-2.5 font-mono text-sm focus:outline-none focus:border-field-red focus:ring-1 focus:ring-field-red/20 appearance-none"
                        >
                          <option value="">No session (general)</option>
                          {job.sessions.map((s) => (
                            <option key={s.id} value={s.id}>
                              {formatSessionLabel(s)}
                            </option>
                          ))}
                        </select>
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-warm-gray text-xs">
                          ▼
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        if (!newNoteBody.trim()) return
                        if (onAddNote) {
                          onAddNote(job.id, {
                            job_id: job.id,
                            session_id: newNoteSessionId,
                            body: newNoteBody.trim(),
                          })
                        }
                        setShowAddNoteInline(false)
                      }}
                      disabled={!newNoteBody.trim()}
                      className="flex-1 flex items-center justify-center gap-1.5 bg-emerald-600 text-white rounded-lg py-2.5 text-xs font-mono font-bold uppercase tracking-wider active:scale-95 transition-all disabled:opacity-50"
                    >
                      <CheckIcon className="w-4 h-4" /> Save
                    </button>
                    <button
                      onClick={() => setShowAddNoteInline(false)}
                      className="flex items-center justify-center gap-1.5 bg-white text-navy border border-navy/10 rounded-lg py-2.5 px-4 text-xs font-mono font-bold uppercase tracking-wider active:scale-95 transition-all"
                    >
                      <XIcon className="w-4 h-4" /> Cancel
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="bg-white rounded-2xl border border-navy/10 shadow-sm divide-y divide-navy/5 overflow-hidden">
            {(() => {
              const unassignedNotes = job.notes.filter(
                (n) => !job.sessions.some((s) => isItemInSession(n, s)),
              )
              const sessionGroups = job.sessions
                .map((session) => ({
                  session,
                  notes: job.notes.filter((n) => isItemInSession(n, session)),
                }))
                .filter((g) => g.notes.length > 0)
              if (job.notes.length === 0) {
                return (
                  <div className="p-6 text-center font-mono text-warm-gray text-sm">
                    No notes recorded.
                  </div>
                )
              }
              const renderNoteItem = (note: (typeof job.notes)[0]) => {
                const isEditingNote = editingNoteId === note.id
                if (isEditingNote) {
                  return (
                    <div key={note.id} className="p-4 bg-cream/50">
                      <textarea
                        value={editNoteBody}
                        onChange={(e) => setEditNoteBody(e.target.value)}
                        rows={3}
                        className="w-full bg-white text-navy border border-navy/10 rounded-lg px-3 py-2 font-mono text-sm focus:outline-none focus:border-field-red focus:ring-1 focus:ring-field-red/20 resize-none mb-2"
                      />
                      {job.sessions.length > 0 && (
                        <div className="mb-3">
                          <label className="flex items-center gap-1.5 text-[10px] font-mono font-bold text-warm-gray uppercase tracking-wider mb-1.5">
                            <ClockIcon className="w-3 h-3" />
                            Assign to Session
                          </label>
                          <div className="relative">
                            <select
                              value={editNoteSessionId || ''}
                              onChange={(e) =>
                                setEditNoteSessionId(e.target.value || null)
                              }
                              className="w-full bg-white text-navy border border-navy/10 rounded-lg px-3 py-2 font-mono text-sm focus:outline-none focus:border-field-red focus:ring-1 focus:ring-field-red/20 appearance-none"
                            >
                              <option value="">No session (general)</option>
                              {job.sessions.map((s) => (
                                <option key={s.id} value={s.id}>
                                  {formatSessionLabel(s)}
                                </option>
                              ))}
                            </select>
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-warm-gray text-xs">
                              ▼
                            </div>
                          </div>
                        </div>
                      )}
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            if (onUpdateNote)
                              onUpdateNote(note.id, {
                                body: editNoteBody,
                                session_id: editNoteSessionId,
                              })
                            setEditingNoteId(null)
                          }}
                          className="flex-1 flex items-center justify-center gap-1.5 bg-emerald-600 text-white rounded-lg py-2 text-xs font-mono font-bold uppercase tracking-wider active:scale-95 transition-all"
                        >
                          <CheckIcon className="w-4 h-4" /> Save
                        </button>
                        <button
                          onClick={() => setEditingNoteId(null)}
                          className="flex-1 flex items-center justify-center gap-1.5 bg-white text-navy border border-navy/10 rounded-lg py-2 text-xs font-mono font-bold uppercase tracking-wider active:scale-95 transition-all"
                        >
                          <XIcon className="w-4 h-4" /> Cancel
                        </button>
                        <button
                          onClick={() => {
                            if (onDeleteNote) onDeleteNote(note.id)
                            setEditingNoteId(null)
                          }}
                          className="flex items-center justify-center bg-white text-field-red border border-field-red/20 rounded-lg px-3 py-2 active:scale-95 transition-all"
                        >
                          <Trash2Icon className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )
                }
                return (
                  <div
                    key={note.id}
                    onClick={() => {
                      setEditingNoteId(note.id)
                      setEditNoteBody(note.body)
                      setEditNoteSessionId(note.session_id || null)
                    }}
                    className="p-4 cursor-pointer hover:bg-[#F0EBE3]/50 transition-colors"
                  >
                    <div className="flex items-start gap-2.5">
                      <FileTextIcon className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                      <div>
                        <div className="font-mono text-sm text-navy leading-snug">
                          {note.body}
                        </div>
                        <div className="text-[10px] font-mono text-warm-gray mt-1">
                          {new Date(note.created_at).toLocaleDateString(
                            'en-US',
                            {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            },
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              }
              return (
                <>
                  {unassignedNotes.length > 0 && (
                    <div>
                      <div className="bg-[#F0EBE3]/50 text-xs font-mono font-bold text-warm-gray uppercase tracking-wider px-4 py-2">
                        Unassigned
                      </div>
                      {unassignedNotes.map((note) => renderNoteItem(note))}
                    </div>
                  )}
                  {sessionGroups.map((group) => (
                    <div key={group.session.id}>
                      <div className="bg-[#F0EBE3]/50 text-xs font-mono font-bold text-warm-gray uppercase tracking-wider px-4 py-2">
                        {formatSessionDate(group.session.started_at)} Session
                      </div>
                      {group.notes.map((note) => renderNoteItem(note))}
                    </div>
                  ))}
                </>
              )
            })()}
          </div>
        </section>

        {/* Photos Section */}
        <section>
          <div className="flex justify-between items-center mb-4 border-b border-navy/10 pb-2">
            <h2 className="text-sm font-mono font-bold text-accent-red flex items-center uppercase tracking-wider">
              <CameraIcon className="w-4 h-4 mr-2" />
              Photos
            </h2>
            <button
              onClick={() => {
                setShowAddPhotoInline(true)
                setNewPhotoFileName('')
                setNewPhotoCaption('')
                setNewPhotoSessionId(null)
              }}
              className="text-xs font-mono font-bold text-field-red uppercase tracking-wider bg-field-red/10 px-3 py-1 rounded-full"
            >
              + Add
            </button>
          </div>

          <AnimatePresence>
            {showAddPhotoInline && (
              <motion.div
                initial={{
                  height: 0,
                  opacity: 0,
                }}
                animate={{
                  height: 'auto',
                  opacity: 1,
                }}
                exit={{
                  height: 0,
                  opacity: 0,
                }}
                transition={{
                  duration: 0.2,
                }}
                className="overflow-hidden mb-4"
              >
                <div className="bg-white rounded-2xl border border-navy/10 shadow-sm p-4">
                  <div className="text-xs font-mono font-bold text-navy uppercase tracking-wider mb-4 flex items-center gap-2">
                    <CameraIcon className="w-3.5 h-3.5 text-blue-600" />
                    New Photo
                  </div>
                  <div className="space-y-3 mb-4">
                    {!newPhotoFileName ? (
                      <button
                        onClick={() =>
                          setNewPhotoFileName(
                            `IMG_${Math.floor(Math.random() * 10000)}.jpg`,
                          )
                        }
                        className="w-full h-28 bg-blue-500/5 border-2 border-dashed border-blue-500/20 rounded-xl flex flex-col items-center justify-center gap-2 text-blue-600 active:bg-blue-500/10 transition-colors"
                      >
                        <CameraIcon className="w-6 h-6" />
                        <span className="font-mono text-sm font-bold">
                          Tap to take photo
                        </span>
                      </button>
                    ) : (
                      <div className="w-full h-28 bg-navy/5 border border-navy/10 rounded-xl flex items-center justify-center relative overflow-hidden">
                        <CameraIcon className="w-8 h-8 text-navy/20" />
                        <div className="absolute bottom-2 right-2 bg-black/50 backdrop-blur-md text-white text-[10px] font-mono px-2 py-1 rounded-md">
                          {newPhotoFileName}
                        </div>
                        <button
                          onClick={() => setNewPhotoFileName('')}
                          className="absolute top-2 right-2 w-6 h-6 bg-black/50 rounded-full flex items-center justify-center text-white text-sm"
                        >
                          ×
                        </button>
                      </div>
                    )}
                    <input
                      value={newPhotoCaption}
                      onChange={(e) => setNewPhotoCaption(e.target.value)}
                      placeholder="Add a caption (optional)"
                      className="w-full bg-cream text-navy border border-navy/10 rounded-lg px-3 py-2.5 font-mono text-sm focus:outline-none focus:border-field-red focus:ring-1 focus:ring-field-red/20 placeholder:text-warm-gray/40"
                    />
                    {job.sessions.length > 0 && (
                      <div className="relative">
                        <select
                          value={newPhotoSessionId || ''}
                          onChange={(e) =>
                            setNewPhotoSessionId(e.target.value || null)
                          }
                          className="w-full bg-cream text-navy border border-navy/10 rounded-lg px-3 py-2.5 font-mono text-sm focus:outline-none focus:border-field-red focus:ring-1 focus:ring-field-red/20 appearance-none"
                        >
                          <option value="">No session (general)</option>
                          {job.sessions.map((s) => (
                            <option key={s.id} value={s.id}>
                              {formatSessionLabel(s)}
                            </option>
                          ))}
                        </select>
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-warm-gray text-xs">
                          ▼
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        if (!newPhotoFileName) return
                        if (onAddAttachment) {
                          onAddAttachment(job.id, {
                            job_id: job.id,
                            session_id: newPhotoSessionId,
                            attachment_role: 'photo',
                            file_name: newPhotoFileName,
                            file_url: newPhotoFileName,
                          })
                        }
                        if (newPhotoCaption.trim() && onAddNote) {
                          onAddNote(job.id, {
                            job_id: job.id,
                            session_id: newPhotoSessionId,
                            body: newPhotoCaption.trim(),
                          })
                        }
                        setShowAddPhotoInline(false)
                      }}
                      disabled={!newPhotoFileName}
                      className="flex-1 flex items-center justify-center gap-1.5 bg-blue-600 text-white rounded-lg py-2.5 text-xs font-mono font-bold uppercase tracking-wider active:scale-95 transition-all disabled:opacity-50"
                    >
                      <CheckIcon className="w-4 h-4" /> Save Photo
                    </button>
                    <button
                      onClick={() => setShowAddPhotoInline(false)}
                      className="flex items-center justify-center gap-1.5 bg-white text-navy border border-navy/10 rounded-lg py-2.5 px-4 text-xs font-mono font-bold uppercase tracking-wider active:scale-95 transition-all"
                    >
                      <XIcon className="w-4 h-4" /> Cancel
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="bg-white rounded-2xl border border-navy/10 shadow-sm divide-y divide-navy/5 overflow-hidden">
            {job.attachments.filter((a) => a.attachment_role === 'photo')
              .length === 0 ? (
              <div className="p-6 text-center font-mono text-warm-gray text-sm">
                No photos recorded.
              </div>
            ) : (
              job.attachments
                .filter((a) => a.attachment_role === 'photo')
                .map((photo) => (
                  <div key={photo.id} className="p-4 flex items-center gap-3">
                    <div className="w-12 h-12 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0">
                      <CameraIcon className="w-5 h-5 text-blue-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-mono font-bold text-sm text-navy truncate">
                        {photo.file_name || 'Photo'}
                      </div>
                      <div className="text-[10px] font-mono text-warm-gray mt-0.5">
                        {new Date(photo.created_at).toLocaleDateString(
                          'en-US',
                          {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          },
                        )}
                      </div>
                    </div>
                    {onDeleteAttachment && (
                      <button
                        onClick={() => onDeleteAttachment(photo.id)}
                        className="w-8 h-8 rounded-full bg-white border border-field-red/20 flex items-center justify-center text-field-red active:scale-95 transition-all shrink-0"
                      >
                        <Trash2Icon className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))
            )}
          </div>
        </section>

        {/* Voice Memos Section */}
        <section>
          <div className="flex justify-between items-center mb-4 border-b border-navy/10 pb-2">
            <h2 className="text-sm font-mono font-bold text-accent-red flex items-center uppercase tracking-wider">
              <MicIcon className="w-4 h-4 mr-2" />
              Voice Memos
            </h2>
            <button
              onClick={() => {
                setShowAddVoiceInline(true)
                setNewVoiceTranscription('')
                setNewVoiceSessionId(null)
              }}
              className="text-xs font-mono font-bold text-field-red uppercase tracking-wider bg-field-red/10 px-3 py-1 rounded-full"
            >
              + Add
            </button>
          </div>

          <AnimatePresence>
            {showAddVoiceInline && (
              <motion.div
                initial={{
                  height: 0,
                  opacity: 0,
                }}
                animate={{
                  height: 'auto',
                  opacity: 1,
                }}
                exit={{
                  height: 0,
                  opacity: 0,
                }}
                transition={{
                  duration: 0.2,
                }}
                className="overflow-hidden mb-4"
              >
                <div className="bg-white rounded-2xl border border-navy/10 shadow-sm p-4">
                  <div className="text-xs font-mono font-bold text-navy uppercase tracking-wider mb-4 flex items-center gap-2">
                    <MicIcon className="w-3.5 h-3.5 text-purple-600" />
                    New Voice Memo
                  </div>
                  <div className="space-y-3 mb-4">
                    {!newVoiceTranscription ? (
                      <button
                        onClick={() =>
                          setNewVoiceTranscription(
                            'Need to pick up more 1/2 inch PVC pipe for the sink repair. Also noticed a small leak near the main valve that we should quote them for.',
                          )
                        }
                        className="w-full py-8 bg-purple-600/5 border-2 border-dashed border-purple-600/20 rounded-xl flex flex-col items-center justify-center gap-3 text-purple-600 active:bg-purple-600/10 transition-colors"
                      >
                        <div className="w-12 h-12 rounded-full bg-purple-600 text-white flex items-center justify-center shadow-lg shadow-purple-600/20">
                          <MicIcon className="w-6 h-6" />
                        </div>
                        <span className="font-mono text-sm font-bold">
                          Tap to record
                        </span>
                      </button>
                    ) : (
                      <div className="space-y-3">
                        <div className="bg-cream rounded-xl p-3 border border-navy/5 flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center text-white shrink-0">
                            <PlayIcon className="w-4 h-4 ml-0.5" />
                          </div>
                          <div className="flex-1">
                            <div className="h-1.5 bg-navy/10 rounded-full w-full overflow-hidden">
                              <div className="h-full bg-purple-600 w-full" />
                            </div>
                          </div>
                          <div className="font-mono text-xs text-warm-gray">
                            0:12
                          </div>
                        </div>
                        <textarea
                          value={newVoiceTranscription}
                          onChange={(e) =>
                            setNewVoiceTranscription(e.target.value)
                          }
                          placeholder="Transcription..."
                          rows={3}
                          className="w-full bg-cream text-navy border border-navy/10 rounded-lg px-3 py-2.5 font-mono text-sm focus:outline-none focus:border-field-red focus:ring-1 focus:ring-field-red/20 placeholder:text-warm-gray/40 resize-none"
                        />
                      </div>
                    )}
                    {job.sessions.length > 0 && (
                      <div className="relative">
                        <select
                          value={newVoiceSessionId || ''}
                          onChange={(e) =>
                            setNewVoiceSessionId(e.target.value || null)
                          }
                          className="w-full bg-cream text-navy border border-navy/10 rounded-lg px-3 py-2.5 font-mono text-sm focus:outline-none focus:border-field-red focus:ring-1 focus:ring-field-red/20 appearance-none"
                        >
                          <option value="">No session (general)</option>
                          {job.sessions.map((s) => (
                            <option key={s.id} value={s.id}>
                              {formatSessionLabel(s)}
                            </option>
                          ))}
                        </select>
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-warm-gray text-xs">
                          ▼
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        if (!newVoiceTranscription.trim()) return
                        if (onAddNote) {
                          onAddNote(job.id, {
                            job_id: job.id,
                            session_id: newVoiceSessionId,
                            body: `[Voice Memo Transcription]: ${newVoiceTranscription.trim()}`,
                          })
                        }
                        setShowAddVoiceInline(false)
                      }}
                      disabled={!newVoiceTranscription.trim()}
                      className="flex-1 flex items-center justify-center gap-1.5 bg-purple-600 text-white rounded-lg py-2.5 text-xs font-mono font-bold uppercase tracking-wider active:scale-95 transition-all disabled:opacity-50"
                    >
                      <CheckIcon className="w-4 h-4" /> Save Memo
                    </button>
                    <button
                      onClick={() => setShowAddVoiceInline(false)}
                      className="flex items-center justify-center gap-1.5 bg-white text-navy border border-navy/10 rounded-lg py-2.5 px-4 text-xs font-mono font-bold uppercase tracking-wider active:scale-95 transition-all"
                    >
                      <XIcon className="w-4 h-4" /> Cancel
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="bg-white rounded-2xl border border-navy/10 shadow-sm divide-y divide-navy/5 overflow-hidden">
            {job.notes.filter((n) =>
              n.body.startsWith('[Voice Memo Transcription]'),
            ).length === 0 ? (
              <div className="p-6 text-center font-mono text-warm-gray text-sm">
                No voice memos recorded.
              </div>
            ) : (
              job.notes
                .filter((n) => n.body.startsWith('[Voice Memo Transcription]'))
                .map((memo) => (
                  <div key={memo.id} className="p-4 flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center text-white shrink-0 mt-0.5">
                      <MicIcon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-mono text-sm text-navy leading-snug">
                        {memo.body.replace('[Voice Memo Transcription]: ', '')}
                      </div>
                      <div className="text-[10px] font-mono text-warm-gray mt-1">
                        {new Date(memo.created_at).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </div>
                    </div>
                    {onDeleteNote && (
                      <button
                        onClick={() => onDeleteNote(memo.id)}
                        className="w-8 h-8 rounded-full bg-white border border-field-red/20 flex items-center justify-center text-field-red active:scale-95 transition-all shrink-0"
                      >
                        <Trash2Icon className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))
            )}
          </div>
        </section>

        {/* Attachments Section */}
        <section>
          <div className="flex justify-between items-center mb-4 border-b border-navy/10 pb-2">
            <h2 className="text-sm font-mono font-bold text-accent-red flex items-center uppercase tracking-wider">
              <FileTextIcon className="w-4 h-4 mr-2" />
              Attachments
            </h2>
            <button
              onClick={() => {
                setShowAddAttachmentInline(true)
                setNewAttachmentFileName('')
                setNewAttachmentSessionId(null)
              }}
              className="text-xs font-mono font-bold text-field-red uppercase tracking-wider bg-field-red/10 px-3 py-1 rounded-full"
            >
              + Add
            </button>
          </div>

          <AnimatePresence>
            {showAddAttachmentInline && (
              <motion.div
                initial={{
                  height: 0,
                  opacity: 0,
                }}
                animate={{
                  height: 'auto',
                  opacity: 1,
                }}
                exit={{
                  height: 0,
                  opacity: 0,
                }}
                transition={{
                  duration: 0.2,
                }}
                className="overflow-hidden mb-4"
              >
                <div className="bg-white rounded-2xl border border-navy/10 shadow-sm p-4">
                  <div className="text-xs font-mono font-bold text-navy uppercase tracking-wider mb-4 flex items-center gap-2">
                    <FileTextIcon className="w-3.5 h-3.5 text-warm-gray" />
                    Upload File
                  </div>
                  <div className="space-y-3 mb-4">
                    {!newAttachmentFileName ? (
                      <button
                        onClick={() =>
                          setNewAttachmentFileName(
                            `document_${Math.floor(Math.random() * 1000)}.pdf`,
                          )
                        }
                        className="w-full h-28 bg-warm-gray/5 border-2 border-dashed border-warm-gray/20 rounded-xl flex flex-col items-center justify-center gap-2 text-warm-gray active:bg-warm-gray/10 transition-colors"
                      >
                        <PlusIcon className="w-6 h-6" />
                        <span className="font-mono text-sm font-bold">
                          Select File
                        </span>
                      </button>
                    ) : (
                      <div className="w-full bg-cream border border-navy/10 rounded-xl p-4 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-warm-gray/10 flex items-center justify-center text-warm-gray shrink-0">
                          <FileTextIcon className="w-5 h-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-mono font-bold text-sm text-navy truncate">
                            {newAttachmentFileName}
                          </div>
                          <div className="font-mono text-xs text-warm-gray mt-0.5">
                            1.2 MB · PDF
                          </div>
                        </div>
                        <button
                          onClick={() => setNewAttachmentFileName('')}
                          className="w-8 h-8 rounded-full bg-navy/5 flex items-center justify-center text-warm-gray"
                        >
                          ×
                        </button>
                      </div>
                    )}
                    {job.sessions.length > 0 && (
                      <div className="relative">
                        <select
                          value={newAttachmentSessionId || ''}
                          onChange={(e) =>
                            setNewAttachmentSessionId(e.target.value || null)
                          }
                          className="w-full bg-cream text-navy border border-navy/10 rounded-lg px-3 py-2.5 font-mono text-sm focus:outline-none focus:border-field-red focus:ring-1 focus:ring-field-red/20 appearance-none"
                        >
                          <option value="">No session (general)</option>
                          {job.sessions.map((s) => (
                            <option key={s.id} value={s.id}>
                              {formatSessionLabel(s)}
                            </option>
                          ))}
                        </select>
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-warm-gray text-xs">
                          ▼
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        if (!newAttachmentFileName) return
                        if (onAddAttachment) {
                          onAddAttachment(job.id, {
                            job_id: job.id,
                            session_id: newAttachmentSessionId,
                            attachment_role: 'generic',
                            file_name: newAttachmentFileName,
                            file_url: newAttachmentFileName,
                          })
                        }
                        setShowAddAttachmentInline(false)
                      }}
                      disabled={!newAttachmentFileName}
                      className="flex-1 flex items-center justify-center gap-1.5 bg-navy text-white rounded-lg py-2.5 text-xs font-mono font-bold uppercase tracking-wider active:scale-95 transition-all disabled:opacity-50"
                    >
                      <CheckIcon className="w-4 h-4" /> Save File
                    </button>
                    <button
                      onClick={() => setShowAddAttachmentInline(false)}
                      className="flex items-center justify-center gap-1.5 bg-white text-navy border border-navy/10 rounded-lg py-2.5 px-4 text-xs font-mono font-bold uppercase tracking-wider active:scale-95 transition-all"
                    >
                      <XIcon className="w-4 h-4" /> Cancel
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="bg-white rounded-2xl border border-navy/10 shadow-sm divide-y divide-navy/5 overflow-hidden">
            {job.attachments.filter((a) => a.attachment_role === 'generic')
              .length === 0 ? (
              <div className="p-6 text-center font-mono text-warm-gray text-sm">
                No attachments recorded.
              </div>
            ) : (
              job.attachments
                .filter((a) => a.attachment_role === 'generic')
                .map((att) => (
                  <div key={att.id} className="p-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-warm-gray/10 flex items-center justify-center text-warm-gray shrink-0">
                      <FileTextIcon className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-mono font-bold text-sm text-navy truncate">
                        {att.file_name || 'File'}
                      </div>
                      <div className="text-[10px] font-mono text-warm-gray mt-0.5">
                        {new Date(att.created_at).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </div>
                    </div>
                    {onDeleteAttachment && (
                      <button
                        onClick={() => onDeleteAttachment(att.id)}
                        className="w-8 h-8 rounded-full bg-white border border-field-red/20 flex items-center justify-center text-field-red active:scale-95 transition-all shrink-0"
                      >
                        <Trash2Icon className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))
            )}
          </div>
        </section>

        {/* Timeline Section */}
        <section>
          <div className="flex items-center mb-4 border-b border-navy/10 pb-2">
            <h2 className="text-sm font-mono font-bold text-accent-red flex items-center uppercase tracking-wider">
              <ActivityIcon className="w-4 h-4 mr-2" />
              Timeline
            </h2>
          </div>
          {timelineEvents.length === 0 ? (
            <div className="text-center py-8 text-warm-gray/60 font-mono text-xs bg-white/50 rounded-2xl border border-navy/5 border-dashed">
              No activity yet
            </div>
          ) : (
            <div className="space-y-2">
              {timelineEvents.map((event) => {
                const icon = getTimelineIcon(event.type)
                return (
                  <div
                    key={event.id}
                    className="flex items-start gap-3 bg-white rounded-xl border border-navy/5 p-3 shadow-sm"
                  >
                    <div
                      className={`w-7 h-7 rounded-full ${icon.color} flex items-center justify-center text-xs shrink-0 mt-0.5`}
                    >
                      {icon.label}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-mono text-sm text-navy leading-snug">
                        {event.description}
                      </div>
                      <div className="text-[10px] font-mono text-warm-gray mt-0.5">
                        {new Date(event.occurred_at).toLocaleDateString(
                          'en-US',
                          {
                            month: 'short',
                            day: 'numeric',
                          },
                        )}{' '}
                        ·{' '}
                        {new Date(event.occurred_at).toLocaleTimeString(
                          'en-US',
                          {
                            hour: 'numeric',
                            minute: '2-digit',
                            hour12: true,
                          },
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </section>
      </div>

      {/* Delete Confirmation Dialog */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <>
            <motion.div
              initial={{
                opacity: 0,
              }}
              animate={{
                opacity: 1,
              }}
              exit={{
                opacity: 0,
              }}
              className="absolute inset-0 bg-navy/40 backdrop-blur-sm z-[80]"
            />
            <motion.div
              initial={{
                opacity: 0,
                scale: 0.95,
              }}
              animate={{
                opacity: 1,
                scale: 1,
              }}
              exit={{
                opacity: 0,
                scale: 0.95,
              }}
              className="absolute inset-x-6 top-1/2 -translate-y-1/2 bg-white rounded-2xl shadow-2xl z-[90] p-6"
            >
              <h3 className="font-serif font-bold text-xl text-navy mb-2">
                Delete Job?
              </h3>
              <p className="font-mono text-sm text-warm-gray mb-6">
                This will permanently delete this job and all associated
                sessions, materials, and notes.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    if (onDeleteJob) onDeleteJob(job.id)
                  }}
                  className="flex-1 bg-field-red text-white rounded-xl py-3 text-sm font-mono font-bold uppercase tracking-wider active:scale-95 transition-all"
                >
                  Delete
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 bg-white text-navy border border-navy/20 rounded-xl py-3 text-sm font-mono font-bold uppercase tracking-wider active:scale-95 transition-all"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

```
```src/pages/JobList.tsx
import React, { useEffect, useState, useRef } from 'react'
import { JobRollup, Screen } from '../types'
import { JobCard } from '../components/JobCard'
import {
  SearchIcon,
  PlusIcon,
  InboxIcon,
  AlertTriangleIcon,
  XIcon,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
interface Props {
  jobs: JobRollup[]
  inboxCount: number
  onNavigate: (screen: Screen, jobId?: string) => void
  onCreateJob: (description: string) => string
  initialFilter?: 'ALL' | 'OPEN' | 'PAID'
}
// Helper to group jobs by last_worked_at relative to today
function groupJobsByDate(jobs: JobRollup[]) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const groups: Record<string, JobRollup[]> = {
    Today: [],
    'This Week': [],
    Older: [],
  }
  jobs.forEach((job) => {
    const refDate = job.last_worked_at || job.created_at
    const jobDate = new Date(refDate)
    jobDate.setHours(0, 0, 0, 0)
    const diffTime = today.getTime() - jobDate.getTime()
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24))
    if (diffDays === 0) {
      groups['Today'].push(job)
    } else if (diffDays > 0 && diffDays <= 7) {
      groups['This Week'].push(job)
    } else {
      groups['Older'].push(job)
    }
  })
  return groups
}
// Helper to compute missing fields for profit completeness
function getMissingFields(job: JobRollup): string[] {
  const missing: string[] = []
  if (!job.short_description) missing.push('No description')
  if (job.sessions.length === 0) missing.push('No sessions')
  if (job.total_invoiced_amount === 0) missing.push('No revenue')
  if (job.materials.length === 0 && !job.no_materials_confirmed)
    missing.push('No materials')
  return missing
}
export function JobList({
  jobs,
  inboxCount,
  onNavigate,
  onCreateJob,
  initialFilter = 'ALL',
}: Props) {
  const [filter, setFilter] = useState<'ALL' | 'OPEN' | 'PAID'>(initialFilter)
  useEffect(() => {
    setFilter(initialFilter)
  }, [initialFilter])
  const [searchQuery, setSearchQuery] = useState('')
  const [isSearchFocused, setIsSearchFocused] = useState(false)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const handleClearSearch = () => {
    setSearchQuery('')
    setIsSearchFocused(false)
    searchInputRef.current?.blur()
  }
  // Apply search filter first
  const searchedJobs = jobs.filter((job) => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      const matchName = job.short_description?.toLowerCase().includes(query)
      const matchCustomer = job.customer_name?.toLowerCase().includes(query)
      if (!matchName && !matchCustomer) return false
    }
    return true
  })
  // Apply tab filter
  const filteredJobs = searchedJobs.filter((job) => {
    if (filter === 'ALL') return true
    if (filter === 'OPEN') return job.job_work_status !== 'paid'
    if (filter === 'PAID') return job.job_work_status === 'paid'
    return true
  })
  const sortedJobs = [...filteredJobs].sort((a, b) => {
    const aDate = a.last_worked_at || a.created_at
    const bDate = b.last_worked_at || b.created_at
    return new Date(bDate).getTime() - new Date(aDate).getTime()
  })
  // All non-paid jobs sorted (for OPEN tab sections)
  const allOpenSorted = [...searchedJobs]
    .filter((job) => job.job_work_status !== 'paid')
    .sort((a, b) => {
      const aDate = a.last_worked_at || a.created_at
      const bDate = b.last_worked_at || b.created_at
      return new Date(bDate).getTime() - new Date(aDate).getTime()
    })
  // Incomplete: ANY non-paid job missing key info, regardless of status
  const incompleteJobs = allOpenSorted.filter(
    (job) => getMissingFields(job).length > 0,
  )
  // In Progress: in_progress status with complete info
  const inProgressJobs = allOpenSorted.filter(
    (job) =>
      job.job_work_status === 'in_progress' &&
      getMissingFields(job).length === 0,
  )
  // Unpaid: completed status with complete info
  const unpaidJobs = allOpenSorted.filter(
    (job) =>
      job.job_work_status === 'completed' && getMissingFields(job).length === 0,
  )
  const groupedJobs = groupJobsByDate(sortedJobs)
  const isSearching = isSearchFocused || searchQuery.length > 0
  return (
    <motion.div
      initial={{
        opacity: 0,
      }}
      animate={{
        opacity: 1,
      }}
      className="min-h-full pb-28 bg-notebook-ruled relative"
    >
      <div className="bg-cream px-5 pt-12 pb-4 shadow-sm relative z-10">
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-field-red rounded-t-[44px]"></div>
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-serif font-bold tracking-widest text-navy">
            JOBS
          </h1>
          <button
            onClick={() => onNavigate('inbox')}
            className="relative p-2 text-warm-gray hover:text-navy transition-colors"
          >
            <InboxIcon className="w-6 h-6" />
            {inboxCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-field-red text-white text-[9px] font-mono font-bold flex items-center justify-center rounded-full border-2 border-cream">
                {inboxCount}
              </span>
            )}
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-warm-gray" />
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Search jobs or customers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setIsSearchFocused(true)}
            onBlur={() => setIsSearchFocused(false)}
            className="w-full bg-white border border-navy/10 rounded-xl py-3 pl-12 pr-10 font-mono text-sm text-navy focus:outline-none focus:ring-2 focus:ring-field-red/20 shadow-sm transition-all"
          />
          {isSearching && (
            <button
              onMouseDown={(e) => {
                e.preventDefault()
                handleClearSearch()
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-navy/10 flex items-center justify-center text-warm-gray hover:bg-navy/20 transition-colors"
            >
              <XIcon className="w-3.5 h-3.5" strokeWidth={2.5} />
            </button>
          )}
        </div>
      </div>

      <div className="px-5 pt-4 pb-4">
        {/* Pill Segmented Control */}
        {!isSearching && (
          <div className="flex bg-[#F0EBE3] p-1 rounded-full mb-6">
            <button
              onClick={() => setFilter('ALL')}
              className={`flex-1 py-2.5 rounded-full text-[11px] font-mono font-bold uppercase tracking-wider transition-all ${filter === 'ALL' ? 'bg-white shadow-sm text-navy' : 'text-warm-gray hover:text-navy'}`}
            >
              All
            </button>
            <button
              onClick={() => setFilter('OPEN')}
              className={`flex-1 py-2.5 rounded-full text-[11px] font-mono font-bold uppercase tracking-wider transition-all ${filter === 'OPEN' ? 'bg-white shadow-sm text-navy' : 'text-warm-gray hover:text-navy'}`}
            >
              Open
            </button>
            <button
              onClick={() => setFilter('PAID')}
              className={`flex-1 py-2.5 rounded-full text-[11px] font-mono font-bold uppercase tracking-wider transition-all ${filter === 'PAID' ? 'bg-white shadow-sm text-navy' : 'text-warm-gray hover:text-navy'}`}
            >
              Paid
            </button>
          </div>
        )}

        {/* Content Area */}
        <AnimatePresence mode="wait">
          {isSearching ? (
            <motion.div
              key="search-results"
              initial={{
                opacity: 0,
                y: 8,
              }}
              animate={{
                opacity: 1,
                y: 0,
              }}
              exit={{
                opacity: 0,
                y: -8,
              }}
              transition={{
                duration: 0.2,
              }}
              className="space-y-4"
            >
              {searchQuery.length === 0 ? (
                <div className="text-center py-16 px-6 bg-white rounded-2xl border border-navy/10 border-dashed">
                  <SearchIcon className="w-8 h-8 text-warm-gray/30 mx-auto mb-3" />
                  <p className="text-warm-gray font-mono font-medium text-sm">
                    Start typing to search jobs
                  </p>
                  <p className="text-warm-gray/50 font-mono text-xs mt-1">
                    Search by job name or customer
                  </p>
                </div>
              ) : searchedJobs.length > 0 ? (
                searchedJobs.map((job) => (
                  <JobCard
                    key={job.id}
                    job={job}
                    onClick={() => onNavigate('jobDetail', job.id)}
                  />
                ))
              ) : (
                <div className="text-center py-16 px-6 bg-white rounded-2xl border border-navy/10 border-dashed">
                  <SearchIcon className="w-8 h-8 text-warm-gray/30 mx-auto mb-3" />
                  <p className="text-warm-gray font-mono font-medium text-sm">
                    No jobs found for "{searchQuery}"
                  </p>
                  <p className="text-warm-gray/50 font-mono text-xs mt-1">
                    Try a different name or customer
                  </p>
                </div>
              )}
            </motion.div>
          ) : filter === 'OPEN' ? (
            <motion.div
              key="open-tab"
              initial={{
                opacity: 0,
                y: 8,
              }}
              animate={{
                opacity: 1,
                y: 0,
              }}
              exit={{
                opacity: 0,
                y: -8,
              }}
              transition={{
                duration: 0.2,
              }}
              className="space-y-8"
            >
              {incompleteJobs.length === 0 &&
              inProgressJobs.length === 0 &&
              unpaidJobs.length === 0 ? (
                <div className="text-center py-12 text-warm-gray/60 font-mono text-xs bg-white/50 rounded-2xl border border-navy/5 border-dashed">
                  No open issues — all caught up ✓
                </div>
              ) : (
                <>
                  {/* Incomplete Section */}
                  {incompleteJobs.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 mb-1.5">
                        <AlertTriangleIcon className="w-3.5 h-3.5 text-amber-600" />
                        <h2 className="text-xs font-mono font-bold text-amber-700 uppercase tracking-wider">
                          Incomplete · {incompleteJobs.length}
                        </h2>
                      </div>
                      <p className="text-[11px] font-mono text-amber-600/70 mb-4 pl-[22px]">
                        Missing key info
                      </p>
                      <div className="space-y-4">
                        {incompleteJobs.map((job) => (
                          <JobCard
                            key={job.id}
                            job={job}
                            onClick={() => onNavigate('jobDetail', job.id)}
                            missingFields={getMissingFields(job)}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* In Progress Section */}
                  {inProgressJobs.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 mb-1.5">
                        <div className="w-3.5 h-3.5 rounded-full bg-blue-500" />
                        <h2 className="text-xs font-mono font-bold text-blue-700 uppercase tracking-wider">
                          In Progress · {inProgressJobs.length}
                        </h2>
                      </div>
                      <p className="text-[11px] font-mono text-blue-600/70 mb-4 pl-[22px]">
                        Active work underway
                      </p>
                      <div className="space-y-4">
                        {inProgressJobs.map((job) => (
                          <JobCard
                            key={job.id}
                            job={job}
                            onClick={() => onNavigate('jobDetail', job.id)}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Unpaid Section */}
                  {unpaidJobs.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 mb-1.5">
                        <div className="w-3.5 h-3.5 rounded-full border-2 border-navy/30" />
                        <h2 className="text-xs font-mono font-bold text-navy uppercase tracking-wider">
                          Unpaid · {unpaidJobs.length}
                        </h2>
                      </div>
                      <p className="text-[11px] font-mono text-warm-gray/70 mb-4 pl-[22px]">
                        Ready to collect
                      </p>
                      <div className="space-y-4">
                        {unpaidJobs.map((job) => (
                          <JobCard
                            key={job.id}
                            job={job}
                            onClick={() => onNavigate('jobDetail', job.id)}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </motion.div>
          ) : (
            <motion.div
              key={filter}
              initial={{
                opacity: 0,
                y: 8,
              }}
              animate={{
                opacity: 1,
                y: 0,
              }}
              exit={{
                opacity: 0,
                y: -8,
              }}
              transition={{
                duration: 0.2,
              }}
              className="space-y-8"
            >
              {/* Job List Grouped by Date */}
              {sortedJobs.length > 0 ? (
                Object.entries(groupedJobs).map(([groupName, groupJobs]) => {
                  if (groupJobs.length === 0) return null
                  return (
                    <div key={groupName}>
                      <h2 className="text-xs font-mono font-bold text-accent-red mb-4 uppercase tracking-wider border-b border-navy/10 pb-2">
                        {groupName}
                      </h2>
                      <div className="space-y-4">
                        {groupJobs.map((job) => (
                          <JobCard
                            key={job.id}
                            job={job}
                            onClick={() => onNavigate('jobDetail', job.id)}
                          />
                        ))}
                      </div>
                    </div>
                  )
                })
              ) : (
                <div className="text-center py-16 text-warm-gray font-mono font-medium bg-white rounded-2xl border border-navy/10 border-dashed">
                  No jobs found.
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Floating New Job button */}
      {!isSearching && (
        <div className="sticky bottom-24 z-40 flex justify-end pr-5 pointer-events-none">
          <motion.button
            initial={{
              scale: 0,
            }}
            animate={{
              scale: 1,
            }}
            onClick={() => onCreateJob('')}
            className="bg-field-red text-white rounded-full px-6 py-3.5 shadow-lg shadow-field-red/30 flex items-center justify-center gap-2 active:scale-95 transition-transform pointer-events-auto"
          >
            <PlusIcon className="w-5 h-5" strokeWidth={2.5} />
            <span className="font-mono font-bold uppercase tracking-wider text-sm">
              New Job
            </span>
          </motion.button>
        </div>
      )}
    </motion.div>
  )
}

```
```src/pages/JobSummary.tsx
import React, { useState } from 'react'
import { JobRollup, Screen } from '../types'
import { motion } from 'framer-motion'
interface Props {
  jobs: JobRollup[]
  onNavigate: (screen: Screen, jobId?: string) => void
  onViewOpenJobs?: () => void
}
export function JobSummary({ jobs, onNavigate, onViewOpenJobs }: Props) {
  const [timePeriod, setTimePeriod] = useState<'week' | 'month' | 'year'>(
    'week',
  )
  // In a real app, we would filter jobs by timePeriod here
  const filteredJobs = jobs
  const totalRevenue = filteredJobs.reduce(
    (sum, job) => sum + job.total_invoiced_amount,
    0,
  )
  const totalMaterials = filteredJobs.reduce(
    (sum, job) => sum + job.total_material_cost,
    0,
  )
  const totalNet = totalRevenue - totalMaterials
  const unpaidJobs = filteredJobs.filter(
    (j) => j.rolled_up_payment_state === 'pending',
  )
  const unpaidRevenue = unpaidJobs.reduce(
    (sum, job) => sum + job.total_invoiced_amount,
    0,
  )
  const jobsWithNet = [...filteredJobs]
    .filter(
      (job) =>
        job.short_description &&
        job.customer_name &&
        job.total_invoiced_amount > 0,
    )
    .map((job) => ({
      ...job,
      net:
        job.estimated_profit ??
        job.total_invoiced_amount - job.total_material_cost,
    }))
  const highestEarnings = [...jobsWithNet]
    .sort((a, b) => b.net - a.net)
    .slice(0, 3)
  const lowestEarnings = [...jobsWithNet]
    .sort((a, b) => a.net - b.net)
    .slice(0, 3)
  const mostProfitable = [...jobsWithNet]
    .filter((j) => j.net_per_hour !== null && j.net_per_hour > 0)
    .sort((a, b) => (b.net_per_hour || 0) - (a.net_per_hour || 0))
    .slice(0, 3)
  const leastProfitable = [...jobsWithNet]
    .filter((j) => j.net_per_hour !== null && j.net_per_hour > 0)
    .sort((a, b) => (a.net_per_hour || 0) - (b.net_per_hour || 0))
    .slice(0, 3)
  const renderJobRow = (job: any, value: string, index: number) => (
    <div
      key={job.id}
      onClick={() => onNavigate('jobDetail', job.id)}
      className="bg-white rounded-2xl border border-navy/10 p-4 flex justify-between items-center shadow-sm hover:shadow-md transition-shadow cursor-pointer"
    >
      <div className="flex items-center gap-4">
        <div className="w-8 h-8 bg-[#F0EBE3] border border-navy/10 text-warm-gray rounded-full flex items-center justify-center font-mono font-bold text-sm">
          {index + 1}
        </div>
        <div>
          <div className="font-serif font-bold text-sm leading-tight text-navy">
            {job.short_description || 'Untitled Job'}
          </div>
          <div className="text-xs font-mono text-warm-gray mt-0.5">
            {job.customer_name || 'No customer'}
          </div>
        </div>
      </div>
      <div className="font-mono font-bold tabular-nums text-emerald-600">
        {value}
      </div>
    </div>
  )
  return (
    <motion.div
      initial={{
        opacity: 0,
      }}
      animate={{
        opacity: 1,
      }}
      className="min-h-full pb-28 bg-notebook-ruled"
    >
      <div className="bg-cream px-4 pt-12 pb-6 shadow-sm relative z-10">
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-field-red rounded-t-[44px]"></div>
        <h1 className="text-2xl font-serif font-bold tracking-widest uppercase mb-4 text-navy">
          Earnings
        </h1>

        {/* Time Period Toggle */}
        <div className="flex bg-[#F0EBE3] p-1 rounded-full">
          <button
            onClick={() => setTimePeriod('week')}
            className={`flex-1 py-2 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider transition-all ${timePeriod === 'week' ? 'bg-white shadow-sm text-navy' : 'text-warm-gray hover:text-navy'}`}
          >
            This Week
          </button>
          <button
            onClick={() => setTimePeriod('month')}
            className={`flex-1 py-2 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider transition-all ${timePeriod === 'month' ? 'bg-white shadow-sm text-navy' : 'text-warm-gray hover:text-navy'}`}
          >
            This Month
          </button>
          <button
            onClick={() => setTimePeriod('year')}
            className={`flex-1 py-2 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider transition-all ${timePeriod === 'year' ? 'bg-white shadow-sm text-navy' : 'text-warm-gray hover:text-navy'}`}
          >
            This Year
          </button>
        </div>
      </div>

      <div className="p-4 space-y-8">
        {/* Big Numbers */}
        <div className="bg-white rounded-3xl border border-navy/10 p-8 shadow-sm">
          <div className="text-center mb-8">
            <div className="text-xs font-mono font-bold text-warm-gray uppercase tracking-widest mb-2">
              Net Earnings
            </div>
            <div
              className={`text-5xl font-mono font-bold tabular-nums tracking-tighter ${totalNet >= 0 ? 'text-emerald-600' : 'text-field-red'}`}
            >
              ${totalNet.toFixed(2)}
            </div>
          </div>

          <div className="flex justify-between border-t border-navy/10 pt-6">
            <div>
              <div className="text-[10px] font-mono font-bold text-warm-gray uppercase tracking-wider mb-1">
                Revenue
              </div>
              <div className="text-xl font-mono font-bold tabular-nums text-navy">
                ${totalRevenue.toFixed(2)}
              </div>
            </div>
            <div className="text-right">
              <div className="text-[10px] font-mono font-bold text-warm-gray uppercase tracking-wider mb-1">
                Materials
              </div>
              <div className="text-xl font-mono font-bold tabular-nums text-field-red">
                -${totalMaterials.toFixed(2)}
              </div>
            </div>
          </div>
        </div>

        {/* Unpaid Alert */}
        {unpaidRevenue > 0 && (
          <div
            onClick={() =>
              onViewOpenJobs ? onViewOpenJobs() : onNavigate('jobs')
            }
            className="bg-amber-50 rounded-2xl border border-amber-200/50 p-5 shadow-sm flex items-center justify-between cursor-pointer hover:shadow-md transition-shadow"
          >
            <div>
              <div className="font-mono font-bold text-amber-800 uppercase tracking-wider text-sm mb-0.5">
                Outstanding
              </div>
              <div className="text-xs font-mono text-amber-700/80">
                {unpaidJobs.length} jobs pending payment
              </div>
            </div>
            <div className="text-2xl font-mono font-bold tabular-nums text-amber-700">
              ${unpaidRevenue.toFixed(2)}
            </div>
          </div>
        )}

        {/* Sections */}
        <div className="space-y-8">
          <div>
            <h2 className="text-xs font-mono font-bold text-accent-red mb-4 uppercase tracking-wider border-b border-navy/10 pb-2">
              Highest Earnings (Net)
            </h2>
            <div className="space-y-3">
              {highestEarnings.map((job, index) =>
                renderJobRow(job, `${job.net.toFixed(2)}`, index),
              )}
            </div>
          </div>

          <div>
            <h2 className="text-xs font-mono font-bold text-accent-red mb-4 uppercase tracking-wider border-b border-navy/10 pb-2">
              Lowest Earnings (Net)
            </h2>
            <div className="space-y-3">
              {lowestEarnings.map((job, index) =>
                renderJobRow(job, `${job.net.toFixed(2)}`, index),
              )}
            </div>
          </div>

          {mostProfitable.length > 0 && (
            <div>
              <h2 className="text-xs font-mono font-bold text-accent-red mb-4 uppercase tracking-wider border-b border-navy/10 pb-2">
                Most Profitable (Net/Hour)
              </h2>
              <div className="space-y-3">
                {mostProfitable.map((job, index) =>
                  renderJobRow(
                    job,
                    `${job.net_per_hour?.toFixed(0)}/hr`,
                    index,
                  ),
                )}
              </div>
            </div>
          )}

          {leastProfitable.length > 0 && (
            <div>
              <h2 className="text-xs font-mono font-bold text-accent-red mb-4 uppercase tracking-wider border-b border-navy/10 pb-2">
                Least Profitable (Net/Hour)
              </h2>
              <div className="space-y-3">
                {leastProfitable.map((job, index) =>
                  renderJobRow(
                    job,
                    `${job.net_per_hour?.toFixed(0)}/hr`,
                    index,
                  ),
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  )
}

```
```src/pages/Profile.tsx
import React, { useState } from 'react'
import { Screen } from '../types'
import { motion } from 'framer-motion'
import {
  ArrowLeftIcon,
  UserIcon,
  CreditCardIcon,
  DatabaseIcon,
  ShieldIcon,
  SettingsIcon,
  ChevronRightIcon,
  CheckIcon,
  Trash2Icon,
  PencilIcon,
  XIcon,
} from 'lucide-react'
interface Props {
  onBack: () => void
  trades: string[]
  onUpdateTrades: (trades: string[]) => void
}
const TRADES = [
  'Remodeling / Renovation',
  'General Contractor',
  'Painting',
  'Handyman / General Home Services',
  'Plumbing',
  'Electrical',
  'Roofing',
  'HVAC',
  'Garage Door',
  'Locksmith',
  'Flooring / Tile',
  'Landscaping / Hardscaping',
  'Pest Control',
  'Appliance Repair',
  'Pool / Spa Service',
  'Cleaning / Janitorial',
  'Fire / Security / Low-Voltage',
  'Other',
]
export function Profile({ onBack, trades, onUpdateTrades }: Props) {
  const [name, setName] = useState('Alex Builder')
  const [email, setEmail] = useState('alex@builder.com')
  // Edit mode for personal info
  const [isEditingPersonalInfo, setIsEditingPersonalInfo] = useState(false)
  const [editName, setEditName] = useState(name)
  const [editEmail, setEditEmail] = useState(email)
  const [editTrades, setEditTrades] = useState<string[]>(trades)
  const [isTradeDropdownOpen, setIsTradeDropdownOpen] = useState(false)
  const handleStartEdit = () => {
    setEditName(name)
    setEditEmail(email)
    setEditTrades([...trades])
    setIsEditingPersonalInfo(true)
    setIsTradeDropdownOpen(false)
  }
  const handleSavePersonalInfo = () => {
    setName(editName)
    setEmail(editEmail)
    onUpdateTrades(editTrades)
    setIsEditingPersonalInfo(false)
    setIsTradeDropdownOpen(false)
  }
  const handleCancelEdit = () => {
    setIsEditingPersonalInfo(false)
    setIsTradeDropdownOpen(false)
  }
  const toggleEditTrade = (trade: string) => {
    if (editTrades.includes(trade)) {
      setEditTrades(editTrades.filter((t) => t !== trade))
    } else {
      setEditTrades([...editTrades, trade])
    }
  }
  return (
    <motion.div
      initial={{
        x: 20,
        opacity: 0,
      }}
      animate={{
        x: 0,
        opacity: 1,
      }}
      className="min-h-full pb-28 bg-notebook-ruled relative"
    >
      {/* Header */}
      <div className="bg-cream px-4 pt-12 pb-4 sticky top-0 z-20 shadow-sm">
        <div className="flex items-center gap-4 mb-2">
          <button
            onClick={onBack}
            className="text-warm-gray hover:text-navy transition-colors"
          >
            <ArrowLeftIcon className="w-6 h-6" />
          </button>
          <h1 className="text-2xl font-serif font-bold tracking-widest text-navy uppercase">
            Profile
          </h1>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Profile Section */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <UserIcon className="w-4 h-4 text-accent-red" />
              <h2 className="text-xs font-mono font-bold text-accent-red uppercase tracking-wider">
                Personal Info
              </h2>
            </div>
            {!isEditingPersonalInfo && (
              <button
                onClick={handleStartEdit}
                className="flex items-center gap-1.5 text-field-red font-mono font-bold text-xs uppercase tracking-wider active:scale-95 transition-all"
              >
                <PencilIcon className="w-3.5 h-3.5" />
                Edit
              </button>
            )}
          </div>

          {!isEditingPersonalInfo /* Display Mode */ ? (
            <div className="bg-white rounded-2xl border border-navy/10 shadow-sm overflow-hidden divide-y divide-navy/5">
              <div className="p-4">
                <label className="block text-[10px] font-mono font-bold text-warm-gray uppercase tracking-wider mb-1">
                  Name
                </label>
                <div className="font-mono text-sm font-medium text-navy">
                  {name}
                </div>
              </div>
              <div className="p-4">
                <label className="block text-[10px] font-mono font-bold text-warm-gray uppercase tracking-wider mb-1">
                  Email
                </label>
                <div className="font-mono text-sm font-medium text-navy">
                  {email}
                </div>
              </div>
              <div className="p-4">
                <label className="block text-[10px] font-mono font-bold text-warm-gray uppercase tracking-wider mb-1">
                  Trade
                </label>
                <div className="font-mono text-sm font-medium text-navy">
                  {trades.length > 0 ? trades.join(', ') : 'No trades selected'}
                </div>
              </div>
            </div> /* Edit Mode */
          ) : (
            <div className="bg-white rounded-2xl border border-field-red/30 shadow-sm overflow-hidden divide-y divide-navy/5 ring-2 ring-field-red/10">
              <div className="p-4">
                <label className="block text-[10px] font-mono font-bold text-warm-gray uppercase tracking-wider mb-1">
                  Name
                </label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  autoFocus
                  className="w-full bg-cream text-navy border border-navy/10 rounded-lg px-3 py-2 font-mono text-sm font-medium focus:outline-none focus:border-field-red focus:ring-1 focus:ring-field-red/20"
                />
              </div>
              <div className="p-4">
                <label className="block text-[10px] font-mono font-bold text-warm-gray uppercase tracking-wider mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  className="w-full bg-cream text-navy border border-navy/10 rounded-lg px-3 py-2 font-mono text-sm font-medium focus:outline-none focus:border-field-red focus:ring-1 focus:ring-field-red/20"
                />
              </div>
              <div className="p-4 relative">
                <label className="block text-[10px] font-mono font-bold text-warm-gray uppercase tracking-wider mb-2">
                  Trade
                </label>
                <button
                  onClick={() => setIsTradeDropdownOpen(!isTradeDropdownOpen)}
                  className="w-full text-left bg-cream border border-navy/10 rounded-lg px-3 py-2.5 font-mono text-sm text-navy flex justify-between items-center"
                >
                  <span className="truncate pr-2">
                    {editTrades.length > 0
                      ? editTrades.join(', ')
                      : 'Select trades...'}
                  </span>
                  <ChevronRightIcon
                    className={`w-4 h-4 text-warm-gray shrink-0 transition-transform ${isTradeDropdownOpen ? 'rotate-90' : ''}`}
                  />
                </button>

                {isTradeDropdownOpen && (
                  <div className="mt-2 bg-white border border-navy/10 rounded-xl shadow-lg max-h-60 overflow-y-auto z-30 relative">
                    {TRADES.map((trade) => {
                      const isSelected = editTrades.includes(trade)
                      return (
                        <button
                          key={trade}
                          onClick={() => toggleEditTrade(trade)}
                          className="w-full text-left px-4 py-3 flex items-center justify-between hover:bg-cream/50 transition-colors border-b border-navy/5 last:border-0"
                        >
                          <span
                            className={`font-mono text-sm ${isSelected ? 'text-navy font-bold' : 'text-navy/80'}`}
                          >
                            {trade}
                          </span>
                          {isSelected && (
                            <CheckIcon className="w-4 h-4 text-emerald-600" />
                          )}
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
              {/* Save / Cancel buttons */}
              <div className="p-4 flex gap-2 bg-cream/30">
                <button
                  onClick={handleSavePersonalInfo}
                  className="flex-1 flex items-center justify-center gap-1.5 bg-emerald-600 text-white rounded-lg py-2.5 text-xs font-mono font-bold uppercase tracking-wider active:scale-95 transition-all shadow-sm"
                >
                  <CheckIcon className="w-4 h-4" />
                  Save
                </button>
                <button
                  onClick={handleCancelEdit}
                  className="flex-1 flex items-center justify-center gap-1.5 bg-white text-navy border border-navy/10 rounded-lg py-2.5 text-xs font-mono font-bold uppercase tracking-wider active:scale-95 transition-all"
                >
                  <XIcon className="w-4 h-4" />
                  Cancel
                </button>
              </div>
            </div>
          )}
        </section>

        {/* Plan Section */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <CreditCardIcon className="w-4 h-4 text-accent-red" />
            <h2 className="text-xs font-mono font-bold text-accent-red uppercase tracking-wider">
              Plan
            </h2>
          </div>
          <div className="bg-white rounded-2xl border border-navy/10 shadow-sm overflow-hidden divide-y divide-navy/5">
            <div className="p-4 flex justify-between items-center">
              <div>
                <div className="font-serif font-bold text-navy">
                  Current Plan
                </div>
                <div className="text-xs font-mono text-warm-gray mt-0.5">
                  Free Tier
                </div>
              </div>
              <div className="bg-navy/5 text-navy px-3 py-1 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider">
                Active
              </div>
            </div>
            <button className="w-full p-4 flex justify-between items-center hover:bg-cream/50 transition-colors text-left">
              <div>
                <div className="font-serif font-bold text-emerald-700">
                  Upgrade to Pro
                </div>
                <div className="text-xs font-mono text-emerald-600/70 mt-0.5">
                  Coming soon
                </div>
              </div>
              <ChevronRightIcon className="w-5 h-5 text-warm-gray" />
            </button>
          </div>
        </section>

        {/* Data Section */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <DatabaseIcon className="w-4 h-4 text-accent-red" />
            <h2 className="text-xs font-mono font-bold text-accent-red uppercase tracking-wider">
              Data
            </h2>
          </div>
          <div className="bg-white rounded-2xl border border-navy/10 shadow-sm overflow-hidden divide-y divide-navy/5">
            <button className="w-full p-4 flex justify-between items-center hover:bg-cream/50 transition-colors text-left">
              <div>
                <div className="font-mono text-sm font-bold text-navy">
                  Export my data
                </div>
                <div className="text-[10px] font-mono text-warm-gray uppercase tracking-wider mt-1">
                  Coming soon
                </div>
              </div>
              <ChevronRightIcon className="w-5 h-5 text-warm-gray" />
            </button>
            <button className="w-full p-4 flex justify-between items-center hover:bg-cream/50 transition-colors text-left">
              <div>
                <div className="font-mono text-sm font-bold text-navy">
                  Download tax forms
                </div>
                <div className="text-[10px] font-mono text-warm-gray uppercase tracking-wider mt-1">
                  Coming soon
                </div>
              </div>
              <ChevronRightIcon className="w-5 h-5 text-warm-gray" />
            </button>
          </div>
        </section>

        {/* Permissions Section */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <ShieldIcon className="w-4 h-4 text-accent-red" />
            <h2 className="text-xs font-mono font-bold text-accent-red uppercase tracking-wider">
              Permissions
            </h2>
          </div>
          <div className="bg-white rounded-2xl border border-navy/10 shadow-sm overflow-hidden divide-y divide-navy/5">
            <div className="p-4 flex justify-between items-center">
              <div className="font-mono text-sm font-bold text-navy">
                Location
              </div>
              <div className="text-[10px] font-mono text-warm-gray uppercase tracking-wider">
                Future
              </div>
            </div>
            <div className="p-4 flex justify-between items-center">
              <div className="font-mono text-sm font-bold text-navy">
                Calendar
              </div>
              <div className="text-[10px] font-mono text-warm-gray uppercase tracking-wider">
                Future
              </div>
            </div>
            <div className="p-4 flex justify-between items-center">
              <div className="font-mono text-sm font-bold text-navy">Email</div>
              <div className="text-[10px] font-mono text-warm-gray uppercase tracking-wider">
                Future
              </div>
            </div>
          </div>
        </section>

        {/* Account Section */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <SettingsIcon className="w-4 h-4 text-accent-red" />
            <h2 className="text-xs font-mono font-bold text-accent-red uppercase tracking-wider">
              Account
            </h2>
          </div>
          <div className="bg-white rounded-2xl border border-navy/10 shadow-sm overflow-hidden divide-y divide-navy/5">
            <button className="w-full p-4 flex justify-between items-center hover:bg-cream/50 transition-colors text-left">
              <div className="font-mono text-sm font-bold text-navy">
                Change password
              </div>
              <ChevronRightIcon className="w-5 h-5 text-warm-gray" />
            </button>
            <button className="w-full p-4 flex justify-between items-center hover:bg-cream/50 transition-colors text-left">
              <div className="font-mono text-sm font-bold text-navy">
                Log out
              </div>
            </button>
          </div>
        </section>

        {/* Delete Account - Separate card with spacing */}
        <section className="pt-4">
          <div className="bg-white rounded-2xl border border-field-red/20 shadow-sm overflow-hidden">
            <button className="w-full p-4 flex items-center gap-3 hover:bg-field-red/5 transition-colors text-left">
              <Trash2Icon className="w-4 h-4 text-field-red" />
              <div className="font-mono text-sm font-bold text-field-red">
                Delete account
              </div>
            </button>
          </div>
        </section>
      </div>
    </motion.div>
  )
}

```
```src/pages/WorkSession.tsx
import React, { useEffect, useState } from 'react'
import { JobRollup, Session } from '../types'
import { useTimer } from '../hooks/useTimer'
import { motion } from 'framer-motion'
interface Props {
  jobs: JobRollup[]
  initialJobId?: string
}
// Helper to get session duration in hours
function getSessionDurationHours(session: Session): number {
  if (!session.ended_at) return 0
  const start = new Date(session.started_at)
  const end = new Date(session.ended_at)
  const minutes = (end.getTime() - start.getTime()) / 60000
  return Math.round((minutes / 60) * 100) / 100
}
function formatSessionDate(isoString: string): string {
  const date = new Date(isoString)
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}
export function WorkSession({ jobs, initialJobId }: Props) {
  const [selectedJobId, setSelectedJobId] = useState(
    initialJobId || (jobs[0]?.id ?? ''),
  )
  const { formattedTime, isRunning, start, stop, reset } = useTimer()
  // Update selected job if initialJobId changes
  useEffect(() => {
    if (initialJobId) setSelectedJobId(initialJobId)
  }, [initialJobId])
  const activeJob = jobs.find((j) => j.id === selectedJobId)
  return (
    <motion.div
      initial={{
        opacity: 0,
      }}
      animate={{
        opacity: 1,
      }}
      className="min-h-full pb-28 bg-notebook-ruled flex flex-col"
    >
      <div className="bg-cream px-4 pt-12 pb-6 shadow-sm relative z-10">
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-field-red rounded-t-[44px]"></div>
        <h1 className="text-2xl font-serif font-bold tracking-widest uppercase mb-6 text-navy">
          Work Timer
        </h1>

        <label className="block text-xs font-mono font-bold text-warm-gray mb-2 uppercase tracking-wider">
          Select Job
        </label>
        <div className="relative">
          <select
            value={selectedJobId}
            onChange={(e) => setSelectedJobId(e.target.value)}
            disabled={isRunning}
            className="w-full bg-[#F0EBE3] text-navy border border-navy/10 rounded-xl p-4 font-mono font-bold appearance-none focus:outline-none focus:ring-2 focus:ring-field-red/20 disabled:opacity-50 transition-all"
          >
            {jobs.map((job) => (
              <option key={job.id} value={job.id}>
                {job.short_description || 'Untitled Job'}
              </option>
            ))}
          </select>
          <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-warm-gray">
            ▼
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-6">
        {/* Timer Display */}
        <div className="relative w-64 h-64 flex items-center justify-center mb-12">
          {isRunning && (
            <motion.div
              animate={{
                scale: [1, 1.05, 1],
                opacity: [0.5, 0.2, 0.5],
              }}
              transition={{
                repeat: Infinity,
                duration: 2,
              }}
              className="absolute inset-0 rounded-full bg-field-red/10"
            />
          )}
          <div className="absolute inset-4 rounded-full border-4 border-ruled-blue flex items-center justify-center bg-white shadow-sm">
            <motion.div
              animate={
                isRunning
                  ? {
                      scale: [1, 1.02, 1],
                    }
                  : {}
              }
              transition={{
                repeat: Infinity,
                duration: 2,
              }}
              className="text-5xl font-mono font-bold tabular-nums tracking-tighter text-navy"
            >
              {formattedTime}
            </motion.div>
          </div>
        </div>

        {/* Controls */}
        <div className="w-full max-w-xs space-y-4">
          {!isRunning ? (
            <button
              onClick={start}
              className="w-full bg-field-red text-white rounded-2xl py-5 text-xl font-mono font-bold tracking-wider uppercase shadow-lg shadow-field-red/20 active:scale-95 transition-all"
            >
              Start Work
            </button>
          ) : (
            <button
              onClick={stop}
              className="w-full bg-navy text-white rounded-2xl py-5 text-xl font-mono font-bold tracking-wider uppercase shadow-lg shadow-navy/20 active:scale-95 transition-all"
            >
              Stop Work
            </button>
          )}

          <button
            onClick={reset}
            disabled={isRunning || formattedTime === '00:00:00'}
            className="w-full bg-transparent text-warm-gray rounded-2xl py-3 text-sm font-mono font-bold tracking-wider uppercase disabled:opacity-30 hover:bg-navy/5 transition-all"
          >
            Reset Timer
          </button>
        </div>
      </div>

      {/* Today's sessions for selected job */}
      {activeJob && (
        <div className="p-4 bg-white border-t border-navy/10">
          <h3 className="text-xs font-mono font-bold text-accent-red mb-3 uppercase tracking-wider">
            Recent Sessions
          </h3>
          <div className="space-y-2">
            {activeJob.sessions.slice(0, 2).map((session) => (
              <div
                key={session.id}
                className="flex justify-between items-center text-sm bg-[#F0EBE3] rounded-lg p-3"
              >
                <span className="font-mono font-medium text-navy">
                  {formatSessionDate(session.started_at)}
                </span>
                <span className="font-mono tabular-nums font-bold text-navy">
                  {getSessionDurationHours(session).toFixed(2)}h
                </span>
              </div>
            ))}
            {activeJob.sessions.length === 0 && (
              <div className="text-sm font-mono text-warm-gray italic p-2">
                No sessions yet.
              </div>
            )}
          </div>
        </div>
      )}
    </motion.div>
  )
}

```
```src/types.ts
// Enums from schema
export type JobCreatedVia = 'session_start' | 'add_job'
export type JobWorkStatus =
  | 'not_started'
  | 'in_progress'
  | 'on_hold'
  | 'completed'
  | 'canceled'
  | 'paid'
export type SessionStatus = 'in_progress' | 'ended' | 'discarded'
export type PaymentState = 'pending' | 'paid'
export type SessionEntryMode = 'live' | 'manual'
export type AttachmentRole = 'invoice' | 'photo' | 'generic'

export interface Job {
  id: string
  created_via: JobCreatedVia
  job_date: string // ISO date string
  short_description: string | null
  job_type: string | null
  customer_name: string | null
  service_address: string | null
  job_work_status: JobWorkStatus
  no_materials_confirmed: boolean // user explicitly confirmed no materials were used
  direct_revenue_amount: number | null
  direct_collected_amount: number | null
  created_at: string
  updated_at: string
}

export interface Session {
  id: string
  job_id: string
  entry_mode: SessionEntryMode
  session_status: SessionStatus
  started_at: string // ISO datetime
  ended_at: string | null
  discarded_at: string | null
  created_at: string
  updated_at: string
}

export interface MaterialEntry {
  id: string
  job_id: string | null
  session_id: string | null
  description: string | null
  quantity: number | null
  unit: string | null
  unit_cost: number | null
  total_cost: number
  purchase_date: string | null
  created_at: string
  updated_at: string
}

export interface Note {
  id: string
  job_id: string | null
  session_id: string | null
  body: string
  created_at: string
  updated_at: string
}

export interface Attachment {
  id: string
  job_id: string | null
  session_id: string | null
  attachment_role: AttachmentRole
  file_name: string | null
  file_url: string
  created_at: string
  updated_at: string
}

// Derived rollup type for UI convenience (mirrors job_rollups_v)
export interface JobRollup extends Job {
  sessions: Session[]
  materials: MaterialEntry[]
  notes: Note[]
  attachments: Attachment[]
  // Derived fields
  total_session_minutes: number
  total_material_cost: number
  total_invoiced_amount: number
  total_collected_amount: number
  total_outstanding_amount: number | null
  rolled_up_payment_state: PaymentState | null
  estimated_profit: number | null
  net_per_hour: number | null
  is_profit_complete: boolean // has date, description, session, revenue, and materials resolved
  last_worked_at: string | null // ended_at of most recent session
  last_activity_at: string // most recent update across job, sessions, notes, materials
}

export type Screen =
  | 'home'
  | 'jobs'
  | 'jobDetail'
  | 'earnings'
  | 'addMaterial'
  | 'addNote'
  | 'inbox'
  | 'profile'

export type InboxCaptureType =
  | 'note'
  | 'photo'
  | 'voice_memo'
  | 'material'
  | 'attachment'

export interface InboxCapture {
  id: string
  type: InboxCaptureType
  body: string | null
  file_url: string | null
  created_at: string
  // Material-specific fields (only when type === 'material')
  material_description?: string
  material_total_cost?: number
  material_quantity?: number
  material_unit?: string
}

export interface ActiveSessionState {
  sessionId: string
  jobId: string
  jobName: string
  startedAt: string
  isExpanded: boolean
}

export interface TimelineEvent {
  id: string
  type:
    | 'session_started'
    | 'session_ended'
    | 'note_added'
    | 'material_added'
    | 'photo_added'
  description: string
  occurred_at: string
  job_id: string
  session_id?: string
}

```
```tailwind.config.js

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./App.tsx",
  ],
  theme: {
    extend: {
      colors: {
        'field-red': '#D4572A',
        'field-red-dark': '#A3421F',
        'navy': '#2B3441',
        'cream': '#FAF6F0',
        'warm-gray': '#8B8680',
        'ruled-blue': '#C8D6E5',
        'accent-red': '#C44B2B',
      },
      fontFamily: {
        sans: ['"IBM Plex Sans"', 'sans-serif'],
        serif: ['"Bitter"', 'serif'],
        mono: ['"IBM Plex Mono"', 'monospace'],
        condensed: ['"IBM Plex Sans Condensed"', 'sans-serif'],
      }
    },
  },
  plugins: [],
}

```