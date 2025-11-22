'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../../../../lib/supabaseClient'

export default function UserManagement() {
  const [users, setUsers] = useState([])
  const [brands, setBrands] = useState([])
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })
  
  const [editingId, setEditingId] = useState(null)

  // Form State - Added 'password'
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '', 
    role: 'user', 
    allowed_brands: [] 
  })

  // 1. Load Data
  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    // Fetch Brands
    const { data: brandData } = await supabase.from('brands').select('*')
    if (brandData) setBrands(brandData)

    // Fetch Users
    const { data: userData, error } = await supabase
      .from('profiles')
      .select('*')
      .order('name', { ascending: true })
    
    if (userData) setUsers(userData)
    if (error) console.error('Error:', error)
  }

  // 2. Handle Inputs
  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData({ ...formData, [name]: value })
  }

  // 3. Handle Brand Checkboxes
  const handleBrandToggle = (brandId) => {
    const currentBrands = formData.allowed_brands || []
    if (currentBrands.includes(brandId)) {
      setFormData({
        ...formData,
        allowed_brands: currentBrands.filter(id => id !== brandId)
      })
    } else {
      setFormData({
        ...formData,
        allowed_brands: [...currentBrands, brandId]
      })
    }
  }

  // 4. Edit User
  const handleEdit = (user) => {
    setEditingId(user.id)
    setFormData({
      name: user.name,
      email: user.email || '',
      password: user.password || '', // Load existing password
      role: user.role,
      allowed_brands: user.allowed_brands || []
    })
    window.scrollTo({ top: 0, behavior: 'smooth' })
    setMessage({ type: 'info', text: `Editing ${user.name}. Update details below.` })
  }

  const cancelEdit = () => {
    setEditingId(null)
    setFormData({ name: '', email: '', password: '', role: 'user', allowed_brands: [] })
    setMessage({ type: '', text: '' })
  }

  // 5. Delete User
  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to permanently remove this user?')) return
    const { error } = await supabase.from('profiles').delete().eq('id', id)
    if (error) alert(error.message)
    else fetchData()
  }

  // 6. Submit
  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMessage({ type: '', text: '' })

    if (!formData.name) {
      setMessage({ type: 'error', text: 'Name is required.' })
      setLoading(false)
      return
    }
    if (!formData.password) {
       setMessage({ type: 'error', text: 'Password is required.' })
       setLoading(false)
       return
    }

    const payload = formData

    let error;
    if (editingId) {
      const res = await supabase.from('profiles').update(payload).eq('id', editingId)
      error = res.error
    } else {
      const res = await supabase.from('profiles').insert([payload])
      error = res.error
    }

    if (error) {
      setMessage({ type: 'error', text: 'Error: ' + error.message })
    } else {
      setMessage({ type: 'success', text: editingId ? 'User updated!' : 'User created successfully!' })
      fetchData()
      if (editingId) cancelEdit()
      else setFormData({ name: '', email: '', password: '', role: 'user', allowed_brands: [] })
    }
    setLoading(false)
  }

  const getBrandNames = (ids) => {
    if (!ids || ids.length === 0) return <span className="text-gray-400 italic">No access</span>
    return ids.map(id => {
      const b = brands.find(brand => brand.id === id)
      return b ? (
        <span key={id} className="inline-block bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded mr-1 mb-1">
          {b.name}
        </span>
      ) : null
    })
  }

  return (
    <div className="max-w-5xl mx-auto pb-20">
      <h1 className="text-3xl font-bold text-gray-800 mb-8">Admin Panel: User Management</h1>

      {/* --- FORM --- */}
      <div className={`bg-white shadow-lg rounded-lg p-8 border mb-12 transition-all ${editingId ? 'border-blue-500 ring-2 ring-blue-100' : 'border-gray-100'}`}>
        
        {message.text && (
          <div className={`p-4 mb-6 rounded-md ${
            message.type === 'error' ? 'bg-red-50 text-red-700' : 
            message.type === 'info' ? 'bg-blue-50 text-blue-700' : 'bg-emerald-50 text-emerald-700'
          }`}>
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Row 1: Name, Email */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="e.g. Akshay"
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#113a3a]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="akshay@truestate.in"
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#113a3a]"
              />
            </div>
          </div>

          {/* Row 2: Password & Role */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input
                type="text" 
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Enter password"
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#113a3a]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
              <select
                name="role"
                value={formData.role}
                onChange={handleChange}
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#113a3a]"
              >
                <option value="user">User (Viewer)</option>
                <option value="admin">Admin (Full Access)</option>
              </select>
            </div>
          </div>

          <div className="border-t border-gray-100 my-4"></div>

          {/* Row 3: Brand Permissions */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-3">Brand Access Permissions</label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {brands.map((brand) => (
                <label key={brand.id} className="flex items-center gap-3 p-3 border rounded-md cursor-pointer hover:bg-gray-50 transition">
                  <input 
                    type="checkbox" 
                    className="w-5 h-5 text-[#113a3a] rounded focus:ring-[#113a3a]"
                    checked={formData.allowed_brands?.includes(brand.id)}
                    onChange={() => handleBrandToggle(brand.id)}
                  />
                  <span className="text-sm font-medium text-gray-700">{brand.name}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-4 pt-4">
            <button
              type="submit"
              disabled={loading}
              className={`flex-1 py-3 px-6 rounded-md text-white font-bold tracking-wide transition duration-200 ${
                loading ? 'bg-gray-400 cursor-not-allowed' : 
                editingId ? 'bg-blue-600 hover:bg-blue-700' : 'bg-[#113a3a] hover:bg-[#0d2e2e]'
              }`}
            >
              {loading ? 'Saving...' : editingId ? 'Update User & Password' : 'Create New User'}
            </button>
            {editingId && (
              <button type="button" onClick={cancelEdit} className="px-6 py-3 rounded-md bg-gray-200 text-gray-700 font-bold hover:bg-gray-300">
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      {/* --- TABLE --- */}
      <div className="bg-white shadow rounded-lg overflow-hidden border border-gray-100">
        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
          <h2 className="font-bold text-gray-700">Team Members</h2>
        </div>
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-100 text-gray-700 uppercase text-xs font-bold">
            <tr>
              <th className="px-6 py-3">Name / Email</th>
              <th className="px-6 py-3">Password</th>
              <th className="px-6 py-3">Role</th>
              <th className="px-6 py-3">Allowed Brands</th>
              <th className="px-6 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {users.map((user) => (
              <tr key={user.id} className={`hover:bg-gray-50 ${editingId === user.id ? 'bg-blue-50' : ''}`}>
                <td className="px-6 py-4">
                  <div className="font-bold text-gray-800">{user.name}</div>
                  <div className="text-xs text-gray-500">{user.email || 'No email'}</div>
                </td>
                <td className="px-6 py-4 font-mono text-xs text-gray-400">
                  {user.password ? '•••••••' : 'No Password'}
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-bold uppercase ${
                    user.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                  }`}>
                    {user.role}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex flex-wrap max-w-xs">
                    {getBrandNames(user.allowed_brands)}
                  </div>
                </td>
                <td className="px-6 py-4 text-right space-x-2">
                  <button onClick={() => handleEdit(user)} className="text-blue-600 hover:underline font-medium">Edit</button>
                  <button onClick={() => handleDelete(user.id)} className="text-red-500 hover:underline font-medium">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}