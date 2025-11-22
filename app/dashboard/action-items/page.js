'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../../../lib/supabaseClient'

export default function ActionItems() {
  const [tasks, setTasks] = useState([])
  const [allUsers, setAllUsers] = useState([]) 
  const [loading, setLoading] = useState(false)
  const [currentUser, setCurrentUser] = useState(null)
  
  const [newTask, setNewTask] = useState({
    due_date: new Date().toISOString().split('T')[0],
    assigned_to: '',
    task: '',
    status: 'Pending'
  })

  useEffect(() => {
    const storedUser = localStorage.getItem('iqol_user')
    if (storedUser) {
      const userObj = JSON.parse(storedUser)
      setCurrentUser(userObj)
      
      // UI Convenience: Pre-fill name for non-admins
      if (userObj.role !== 'admin') {
        setNewTask(prev => ({ ...prev, assigned_to: userObj.name }))
      }
    }
    fetchTasks()
    fetchProfiles()
  }, [])

  const fetchProfiles = async () => {
    const { data } = await supabase.from('profiles').select('name, role')
    if (data) setAllUsers(data)
  }

  const fetchTasks = async () => {
    const { data } = await supabase
      .from('action_items')
      .select('*')
      .order('due_date', { ascending: false })
      .order('id', { ascending: false })

    if (data) setTasks(data)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // SECURITY CHECK: 
    // Even if a user hacks the UI input, we force the 'assigned_to' 
    // to be their own name here in the logic.
    let finalAssignee = newTask.assigned_to
    
    if (currentUser.role !== 'admin') {
      finalAssignee = currentUser.name // Force overwrite
    }

    if (!newTask.task || !finalAssignee) return alert('Please fill in all fields')
    
    setLoading(true)

    // Prepare the final secure payload
    const securePayload = {
      ...newTask,
      assigned_to: finalAssignee
    }

    const { error } = await supabase.from('action_items').insert([securePayload])
    
    if (error) {
      alert('Error: ' + error.message)
    } else {
      fetchTasks()
      setNewTask(prev => ({ ...prev, task: '' }))
    }
    setLoading(false)
  }

  const toggleStatus = async (task) => {
    const newStatus = task.status === 'Pending' ? 'Done' : 'Pending'
    const updatedTasks = tasks.map(t => t.id === task.id ? { ...t, status: newStatus } : t)
    setTasks(updatedTasks)
    await supabase.from('action_items').update({ status: newStatus }).eq('id', task.id)
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this task?')) return
    const { error } = await supabase.from('action_items').delete().eq('id', id)
    if (!error) fetchTasks()
  }

  const groupedTasks = tasks.reduce((acc, task) => {
    const date = task.due_date
    if (!acc[date]) acc[date] = []
    acc[date].push(task)
    return acc
  }, {})

  if (!currentUser) return <div className="p-10 text-gray-500">Loading permissions...</div>

  return (
    <div className="max-w-5xl mx-auto pb-20">
      <h1 className="text-3xl font-bold text-gray-800 mb-8">Meeting Action Items</h1>

      {/* --- ADD TASK BAR --- */}
      <div className="bg-white p-6 rounded-lg shadow-lg border border-gray-200 mb-10 sticky top-4 z-20">
        <div className="mb-4 text-sm text-gray-500">
          Creating as: <span className="font-bold text-[#113a3a]">{currentUser.name}</span> 
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col md:flex-row gap-4 items-end">
          <div className="w-full md:w-1/5">
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Meeting Date</label>
            <input 
              type="date" 
              value={newTask.due_date}
              onChange={(e) => setNewTask({...newTask, due_date: e.target.value})}
              className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-[#113a3a]"
            />
          </div>
          
          <div className="w-full md:w-1/4">
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Assigned To</label>
            
            {currentUser.role === 'admin' ? (
              <select 
                value={newTask.assigned_to}
                onChange={(e) => setNewTask({...newTask, assigned_to: e.target.value})}
                className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-[#113a3a] bg-white"
              >
                <option value="">Select Person...</option>
                {allUsers.map(u => (
                  <option key={u.name} value={u.name}>{u.name}</option>
                ))}
              </select>
            ) : (
              // Read-Only Input for Regular Users
              <input 
                type="text" 
                value={currentUser.name}
                disabled
                className="w-full p-2 border border-gray-300 bg-gray-100 text-gray-500 rounded cursor-not-allowed"
              />
            )}
          </div>

          <div className="w-full md:flex-1">
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Action Item</label>
            <input 
              type="text" 
              placeholder="What needs to be done?"
              value={newTask.task}
              onChange={(e) => setNewTask({...newTask, task: e.target.value})}
              className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-[#113a3a]"
            />
          </div>
          
          <button 
            type="submit" 
            disabled={loading}
            className="w-full md:w-auto bg-[#113a3a] hover:bg-[#0d2e2e] text-white font-bold py-2.5 px-6 rounded transition"
          >
            {loading ? '+' : 'Add'}
          </button>
        </form>
      </div>

      {/* --- TASK LISTS --- */}
      <div className="space-y-8">
        {Object.keys(groupedTasks).map((date) => (
          <div key={date} className="bg-white shadow rounded-lg overflow-hidden border border-gray-100">
            <div className="bg-gray-50 px-6 py-3 border-b border-gray-200 flex justify-between items-center">
              <h2 className="font-bold text-gray-700 flex items-center gap-2">
                📅 {new Date(date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
              </h2>
            </div>

            <table className="w-full text-left text-sm">
              <tbody className="divide-y divide-gray-100">
                {groupedTasks[date].map((task) => (
                  <tr key={task.id} className="group hover:bg-blue-50 transition duration-150">
                    <td className="px-6 py-4 w-[180px]">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-800 flex items-center justify-center text-xs font-bold uppercase">
                          {task.assigned_to.substring(0, 2)}
                        </div>
                        <span className="font-medium text-gray-900">{task.assigned_to}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-base ${task.status === 'Done' ? 'text-gray-400 line-through' : 'text-gray-700'}`}>
                        {task.task}
                      </span>
                    </td>
                    <td className="px-6 py-4 w-[150px] text-center">
                      <button
                        onClick={() => toggleStatus(task)}
                        className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase w-24 ${
                          task.status === 'Done' 
                            ? 'bg-green-100 text-green-800 border border-green-200' 
                            : 'bg-red-100 text-red-800 border border-red-200'
                        }`}
                      >
                        {task.status}
                      </button>
                    </td>
                    <td className="px-6 py-4 w-[50px] text-right">
                      {(currentUser.role === 'admin' || currentUser.name === task.assigned_to) && (
                        <button onClick={() => handleDelete(task.id)} className="text-gray-300 hover:text-red-500 p-2">✕</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
      </div>
    </div>
  )
}