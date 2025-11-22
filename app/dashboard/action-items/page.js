'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../../../lib/supabaseClient'

export default function ActionItems() {
  const [tasks, setTasks] = useState([])
  const [users, setUsers] = useState([]) // List of all profiles
  const [loading, setLoading] = useState(false)
  
  // --- MOCK AUTH STATE (For Testing) ---
  // In a real app, this comes from supabase.auth.getUser()
  const [currentUser, setCurrentUser] = useState({ name: 'Loading...', role: 'user' })
  
  // Form State
  const [newTask, setNewTask] = useState({
    due_date: new Date().toISOString().split('T')[0],
    assigned_to: '',
    task: '',
    status: 'Pending'
  })

  // 1. Load Data (Tasks + Users)
  useEffect(() => {
    fetchTasks()
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    const { data } = await supabase.from('profiles').select('*')
    if (data && data.length > 0) {
      setUsers(data)
      // Set default current user to the first Admin found for demo purposes
      const admin = data.find(u => u.role === 'admin') || data[0]
      setCurrentUser(admin)
      // Initialize the form with that user
      setNewTask(prev => ({ ...prev, assigned_to: admin.name }))
    }
  }

  const fetchTasks = async () => {
    const { data, error } = await supabase
      .from('action_items')
      .select('*')
      .order('due_date', { ascending: false })
      .order('id', { ascending: false })

    if (data) setTasks(data)
  }

  // 2. Handle "Current User" Switch (Dev Tool)
  const handleUserSwitch = (userId) => {
    const user = users.find(u => u.id === userId)
    setCurrentUser(user)
    // If regular user, force the form to their name
    if (user.role !== 'admin') {
      setNewTask(prev => ({ ...prev, assigned_to: user.name }))
    }
  }

  // 3. Add New Task
  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!newTask.task || !newTask.assigned_to) return alert('Please fill in all fields')
    
    setLoading(true)
    const { error } = await supabase.from('action_items').insert([newTask])
    
    if (error) {
      alert('Error: ' + error.message)
    } else {
      fetchTasks()
      // Reset task input only
      setNewTask(prev => ({ ...prev, task: '' }))
    }
    setLoading(false)
  }

  // 4. Toggle Status
  const toggleStatus = async (task) => {
    // Optional: Prevent users from marking other people's tasks as Done?
    // For now, we allow it as it's a dashboard.
    const newStatus = task.status === 'Pending' ? 'Done' : 'Pending'
    
    // Optimistic UI Update
    const updatedTasks = tasks.map(t => t.id === task.id ? { ...t, status: newStatus } : t)
    setTasks(updatedTasks)

    await supabase.from('action_items').update({ status: newStatus }).eq('id', task.id)
  }

  // 5. Delete Task
  const handleDelete = async (id) => {
    if (!confirm('Delete this task?')) return
    const { error } = await supabase.from('action_items').delete().eq('id', id)
    if (!error) fetchTasks()
  }

  // Grouping Logic
  const groupedTasks = tasks.reduce((acc, task) => {
    const date = task.due_date
    if (!acc[date]) acc[date] = []
    acc[date].push(task)
    return acc
  }, {})

  return (
    <div className="max-w-5xl mx-auto pb-20 relative">
      
      {/* --- DEV TOOL: USER SWITCHER --- */}
      <div className="absolute top-0 right-0 bg-gray-800 text-white text-xs p-2 rounded-bl-lg shadow-md z-50 flex items-center gap-2">
        <span>Simulate Login:</span>
        <select 
          className="bg-gray-700 text-white border border-gray-600 rounded px-1"
          onChange={(e) => handleUserSwitch(e.target.value)}
          value={currentUser.id}
        >
          {users.map(u => (
            <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
          ))}
        </select>
      </div>

      <h1 className="text-3xl font-bold text-gray-800 mb-8 mt-4">Meeting Action Items</h1>

      {/* --- ADD TASK BAR --- */}
      <div className="bg-white p-6 rounded-lg shadow-lg border border-gray-200 mb-10 sticky top-4 z-20">
        <div className="mb-4 text-sm text-gray-500">
          Logged in as: <span className="font-bold text-[#113a3a]">{currentUser.name}</span> 
          {currentUser.role === 'admin' ? ' (Admin Access)' : ' (Restricted Access)'}
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
              // ADMIN VIEW: Dropdown to select ANY user
              <select 
                value={newTask.assigned_to}
                onChange={(e) => setNewTask({...newTask, assigned_to: e.target.value})}
                className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-[#113a3a] bg-white"
              >
                {users.map(u => (
                  <option key={u.id} value={u.name}>{u.name}</option>
                ))}
              </select>
            ) : (
              // USER VIEW: Locked Input (Read Only)
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
                      {/* Allow deletion if Admin OR if Current User owns the task */}
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