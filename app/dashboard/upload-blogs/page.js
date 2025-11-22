'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../../../lib/supabaseClient'

export default function UploadBlogs() {
  const [brands, setBrands] = useState([])
  const [recentBlogs, setRecentBlogs] = useState([])
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })
  
  const [editingId, setEditingId] = useState(null)
  const [currentUser, setCurrentUser] = useState(null)

  // Form State
  const [formData, setFormData] = useState({
    brand_id: '',
    published_date: new Date().toISOString().split('T')[0],
    title: '',
    blog_link: '',
    views: '',
    ai_detection_score: '',
  })

  // 1. Load Data & User
  useEffect(() => {
    const checkUserAndFetch = async () => {
      const storedUser = localStorage.getItem('iqol_user')
      const userObj = storedUser ? JSON.parse(storedUser) : null
      setCurrentUser(userObj)

      // Fetch Brands
      const { data: allBrands } = await supabase.from('brands').select('*')
      
      if (allBrands && userObj) {
        // FILTER LOGIC
        if (userObj.role === 'admin') {
          setBrands(allBrands)
        } else {
          const allowed = allBrands.filter(b => userObj.allowed_brands?.includes(b.id.toString()))
          setBrands(allowed)
        }
      }
      
      fetchRecentBlogs()
    }
    checkUserAndFetch()
  }, [])

  const fetchRecentBlogs = async () => {
    const { data, error } = await supabase
      .from('blogs')
      .select(`*, brands (name)`)
      .order('published_date', { ascending: false })
      .limit(20)

    if (data) setRecentBlogs(data)
  }

  // 2. Handle Inputs
  const handleChange = (e) => {
    const { name, value } = e.target
    if (name === 'views' || name === 'ai_detection_score') {
      const val = value === '' ? '' : parseInt(value)
      setFormData({ ...formData, [name]: val })
    } else {
      setFormData({ ...formData, [name]: value })
    }
  }

  // 3. Edit
  const handleEdit = (item) => {
    // Security Check
    if (currentUser?.role !== 'admin' && !currentUser?.allowed_brands?.includes(item.brand_id.toString())) {
      alert("You do not have permission to edit this brand's blogs.")
      return
    }

    setEditingId(item.id)
    setFormData({
      brand_id: item.brand_id,
      published_date: item.published_date,
      title: item.title,
      blog_link: item.blog_link || '',
      views: item.views,
      ai_detection_score: item.ai_detection_score,
    })
    window.scrollTo({ top: 0, behavior: 'smooth' })
    setMessage({ type: 'info', text: `Editing "${item.title}".` })
  }

  const cancelEdit = () => {
    setEditingId(null)
    setFormData({
      brand_id: '',
      published_date: new Date().toISOString().split('T')[0],
      title: '',
      blog_link: '',
      views: '',
      ai_detection_score: '',
    })
    setMessage({ type: '', text: '' })
  }

  // 4. Delete
  const handleDelete = async (id, brandId) => {
    if (currentUser?.role !== 'admin' && !currentUser?.allowed_brands?.includes(brandId.toString())) {
      alert("You do not have permission to delete this blog.")
      return
    }

    if (!confirm('Are you sure you want to delete this blog entry?')) return
    const { error } = await supabase.from('blogs').delete().eq('id', id)

    if (error) alert('Error deleting: ' + error.message)
    else {
      fetchRecentBlogs()
      if (editingId === id) cancelEdit()
    }
  }

  // 5. Submit
  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMessage({ type: '', text: '' })

    if (!formData.brand_id) {
      setMessage({ type: 'error', text: 'Please select a brand.' })
      setLoading(false)
      return
    }

    const payload = {
      ...formData,
      views: formData.views || 0,
      ai_detection_score: formData.ai_detection_score === '' ? null : formData.ai_detection_score,
    }

    let error;
    if (editingId) {
      const response = await supabase.from('blogs').update(payload).eq('id', editingId)
      error = response.error
    } else {
      const response = await supabase.from('blogs').insert([payload])
      error = response.error
    }

    if (error) {
      setMessage({ type: 'error', text: 'Error: ' + error.message })
    } else {
      setMessage({ type: 'success', text: editingId ? 'Blog updated!' : 'Blog added successfully!' })
      fetchRecentBlogs()
      if (editingId) cancelEdit() 
      else {
        setFormData(prev => ({ ...prev, title: '', blog_link: '', views: '', ai_detection_score: '' }))
      }
    }
    setLoading(false)
  }

  const getHealthBadge = (score) => {
    if (score === null || score === undefined || score === '') return <span className="text-gray-400 text-xs italic">Not Tested</span>
    let colorClass = '', label = ''
    if (score <= 20) { colorClass = 'bg-green-100 text-green-800 border-green-200'; label = 'Healthy' }
    else if (score <= 50) { colorClass = 'bg-orange-100 text-orange-800 border-orange-200'; label = 'Moderate' }
    else { colorClass = 'bg-red-100 text-red-800 border-red-200'; label = 'High AI' }
    return <span className={`px-3 py-1 rounded-full text-xs font-bold border ${colorClass} inline-flex items-center gap-2`}><span className={`w-2 h-2 rounded-full ${score <= 20 ? 'bg-green-500' : score <= 50 ? 'bg-orange-500' : 'bg-red-500'}`}></span>{label} ({score}%)</span>
  }

  return (
    <div className="max-w-[95%] mx-auto pb-12">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">{editingId ? 'Edit Blog Entry' : 'Upload Blog Entry'}</h1>

      <div className={`bg-white shadow-lg rounded-lg p-8 border mb-12 transition-all duration-300 ${editingId ? 'border-blue-500 ring-2 ring-blue-100' : 'border-gray-100'}`}>
        {message.text && <div className={`p-4 mb-6 rounded-md ${message.type === 'error' ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-700'}`}>{message.text}</div>}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Select Brand</label>
              <select name="brand_id" value={formData.brand_id} onChange={handleChange} className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#113a3a]">
                <option value="">-- Choose Brand --</option>
                {brands.map((brand) => <option key={brand.id} value={brand.id}>{brand.name}</option>)}
              </select>
              {brands.length === 0 && <p className="text-xs text-red-500 mt-1">No brands assigned.</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Published Date</label>
              <input type="date" name="published_date" value={formData.published_date} onChange={handleChange} className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#113a3a]" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Blog Title</label>
              <input type="text" name="title" value={formData.title} onChange={handleChange} placeholder="e.g., Top 5 Real Estate Trends" className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#113a3a]" />
            </div>
             <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Blog URL</label>
              <input type="text" name="blog_link" value={formData.blog_link} onChange={handleChange} placeholder="https://..." className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#113a3a]" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Current Views</label>
              <input type="number" name="views" value={formData.views} onChange={handleChange} placeholder="0" className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#113a3a]" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">AI Detection Score (%)</label>
              <div className="relative">
                <input type="number" name="ai_detection_score" value={formData.ai_detection_score} onChange={handleChange} placeholder="e.g. 15" min="0" max="100" className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#113a3a]" />
                <span className="absolute right-4 top-3 text-gray-400 font-bold">%</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4 pt-2">
            <button type="submit" disabled={loading} className={`flex-1 py-4 px-6 rounded-md text-white font-bold tracking-wide transition duration-200 ${loading ? 'bg-gray-400 cursor-not-allowed' : editingId ? 'bg-blue-600 hover:bg-blue-700' : 'bg-[#113a3a] hover:bg-[#0d2e2e]'}`}>{loading ? 'Saving...' : editingId ? 'Update Blog' : 'Save Blog Entry'}</button>
            {editingId && <button type="button" onClick={cancelEdit} className="px-6 py-4 rounded-md bg-gray-200 text-gray-700 font-bold hover:bg-gray-300 transition">Cancel</button>}
          </div>
        </form>
      </div>

      <div className="bg-white shadow-lg rounded-lg overflow-hidden border border-gray-100">
        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
          <h2 className="text-lg font-semibold text-gray-700">Recent Blog Posts</h2>
          <span className="text-xs text-gray-400 italic">Scroll horizontally →</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600 whitespace-nowrap">
            <thead className="bg-gray-100 text-gray-700 uppercase text-xs font-bold">
              <tr>
                <th className="px-6 py-3 w-[120px]">Date</th>
                <th className="px-6 py-3 w-[150px]">Brand</th>
                <th className="px-6 py-3 min-w-[250px]">Title</th>
                <th className="px-6 py-3 text-blue-800 bg-blue-50 w-[100px]">Views</th>
                <th className="px-6 py-3 w-[180px]">Blog Health</th>
                <th className="px-6 py-3 text-right w-[150px]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {recentBlogs.map((item) => (
                <tr key={item.id} className={`hover:bg-gray-50 transition ${editingId === item.id ? 'bg-blue-50' : ''}`}>
                  <td className="px-6 py-4 font-medium text-gray-900">{item.published_date}</td>
                  <td className="px-6 py-4 font-bold text-[#113a3a]">{item.brands?.name || 'Unknown'}</td>
                  <td className="px-6 py-4 max-w-[250px] truncate">{item.blog_link ? <a href={item.blog_link} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline font-medium flex items-center gap-2">{item.title}<span className="text-xs text-gray-400">↗</span></a> : <span>{item.title}</span>}</td>
                  <td className="px-6 py-4 bg-blue-50/50 font-mono font-medium">{item.views.toLocaleString()}</td>
                  <td className="px-6 py-4">{getHealthBadge(item.ai_detection_score)}</td>
                  <td className="px-6 py-4 text-right space-x-3">
                    <button onClick={() => handleEdit(item)} className="text-blue-600 hover:text-blue-900 font-medium underline">Edit</button>
                    <button onClick={() => handleDelete(item.id, item.brand_id)} className="text-red-500 hover:text-red-700 font-medium hover:underline">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}