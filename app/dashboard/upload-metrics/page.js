'use client'

import { useState, useEffect } from 'react'
// Using the correct relative path to root
import { supabase } from '../../../lib/supabaseClient'

export default function UploadMetrics() {
  const [brands, setBrands] = useState([])
  const [recentMetrics, setRecentMetrics] = useState([])
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })
  
  // New state to track if we are editing a specific row
  const [editingId, setEditingId] = useState(null)

  // Form State
  const [formData, setFormData] = useState({
    brand_id: '',
    date: new Date().toISOString().split('T')[0],
    website_visits: '',
    linkedin_impressions: '',
    linkedin_followers: '',
    instagram_views: '',
    instagram_followers: '',
  })

  // 1. Load Data
  useEffect(() => {
    fetchBrands()
    fetchRecentMetrics()
  }, [])

  const fetchBrands = async () => {
    const { data } = await supabase.from('brands').select('*')
    if (data) setBrands(data)
  }

  const fetchRecentMetrics = async () => {
    const { data, error } = await supabase
      .from('daily_metrics')
      .select(`*, brands (name)`)
      .order('created_at', { ascending: false }) // Show newest first
      .limit(20) // Increased limit to 20

    if (data) setRecentMetrics(data)
    if (error) console.error('Error fetching metrics:', error)
  }

  // 2. Handle Inputs
  const handleChange = (e) => {
    const { name, value } = e.target
    if (name === 'brand_id' || name === 'date') {
      setFormData({ ...formData, [name]: value })
    } else {
      const val = value === '' ? '' : parseInt(value)
      setFormData({ ...formData, [name]: val })
    }
  }

  // 3. Load a Row into the Form for Editing
  const handleEdit = (item) => {
    setEditingId(item.id)
    setFormData({
      brand_id: item.brand_id,
      date: item.date,
      website_visits: item.website_visits,
      linkedin_impressions: item.linkedin_impressions,
      linkedin_followers: item.linkedin_followers,
      instagram_views: item.instagram_views,
      instagram_followers: item.instagram_followers,
    })
    // Scroll to top so user sees the form
    window.scrollTo({ top: 0, behavior: 'smooth' })
    setMessage({ type: 'info', text: `Editing entry for ${item.date}. Change values and click Update.` })
  }

  const cancelEdit = () => {
    setEditingId(null)
    setFormData({
      brand_id: '',
      date: new Date().toISOString().split('T')[0],
      website_visits: '',
      linkedin_impressions: '',
      linkedin_followers: '',
      instagram_views: '',
      instagram_followers: '',
    })
    setMessage({ type: '', text: '' })
  }

  // 4. Delete Row
  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this entry?')) return

    const { error } = await supabase.from('daily_metrics').delete().eq('id', id)

    if (error) {
      alert('Error deleting: ' + error.message)
    } else {
      fetchRecentMetrics()
      // If we deleted the item currently being edited, cancel edit mode
      if (editingId === id) cancelEdit()
    }
  }

  // 5. Submit (Handles both INSERT and UPDATE)
  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMessage({ type: '', text: '' })

    if (!formData.brand_id) {
      setMessage({ type: 'error', text: 'Please select a brand.' })
      setLoading(false)
      return
    }

    // Convert empty strings to 0 for DB
    const payload = {
      ...formData,
      website_visits: formData.website_visits || 0,
      linkedin_impressions: formData.linkedin_impressions || 0,
      linkedin_followers: formData.linkedin_followers || 0,
      instagram_views: formData.instagram_views || 0,
      instagram_followers: formData.instagram_followers || 0,
    }

    let error;

    if (editingId) {
      // UPDATE existing row
      const response = await supabase
        .from('daily_metrics')
        .update(payload)
        .eq('id', editingId)
      error = response.error
    } else {
      // INSERT new row
      const response = await supabase
        .from('daily_metrics')
        .insert([payload])
      error = response.error
    }

    if (error) {
      setMessage({ type: 'error', text: 'Error: ' + error.message })
    } else {
      setMessage({ type: 'success', text: editingId ? 'Entry updated!' : 'Metrics added successfully!' })
      fetchRecentMetrics()
      if (editingId) cancelEdit() // Exit edit mode
      else {
        // Reset form (keep date/brand?) - defaulting to clear
        setFormData(prev => ({
          ...prev,
          website_visits: '',
          linkedin_impressions: '',
          linkedin_followers: '',
          instagram_views: '',
          instagram_followers: '',
        }))
      }
    }
    setLoading(false)
  }

  return (
    <div className="max-w-[95%] mx-auto pb-12">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">
        {editingId ? 'Edit Daily Metrics' : 'Upload Daily Metrics'}
      </h1>

      {/* --- FORM SECTION --- */}
      <div className={`bg-white shadow-lg rounded-lg p-8 border mb-12 transition-all duration-300 ${editingId ? 'border-blue-500 ring-2 ring-blue-100' : 'border-gray-100'}`}>
        
        {message.text && (
          <div className={`p-4 mb-6 rounded-md ${
            message.type === 'error' ? 'bg-red-50 text-red-700' : 
            message.type === 'info' ? 'bg-blue-50 text-blue-700' : 'bg-emerald-50 text-emerald-700'
          }`}>
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Select Brand</label>
              <select
                name="brand_id"
                value={formData.brand_id}
                onChange={handleChange}
                className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#113a3a]"
              >
                <option value="">-- Choose Brand --</option>
                {brands.map((brand) => (
                  <option key={brand.id} value={brand.id}>{brand.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
              <input
                type="date"
                name="date"
                value={formData.date}
                onChange={handleChange}
                className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#113a3a]"
              />
            </div>
          </div>

          <div className="border-t border-gray-100 my-4"></div>

          {/* Metric Inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Web Visits</label>
              <input type="number" name="website_visits" value={formData.website_visits} onChange={handleChange} placeholder="0"
                className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-[#113a3a]" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">LI Impressions</label>
              <input type="number" name="linkedin_impressions" value={formData.linkedin_impressions} onChange={handleChange} placeholder="0"
                className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-[#113a3a]" />
            </div>
            <div>
               <label className="block text-xs font-bold text-gray-500 uppercase mb-1">LI Followers</label>
              <input type="number" name="linkedin_followers" value={formData.linkedin_followers} onChange={handleChange} placeholder="0"
                className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-[#113a3a]" />
            </div>
             <div>
               <label className="block text-xs font-bold text-gray-500 uppercase mb-1">IG Views</label>
              <input type="number" name="instagram_views" value={formData.instagram_views} onChange={handleChange} placeholder="0"
                className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-[#113a3a]" />
            </div>
             <div>
               <label className="block text-xs font-bold text-gray-500 uppercase mb-1">IG Followers</label>
              <input type="number" name="instagram_followers" value={formData.instagram_followers} onChange={handleChange} placeholder="0"
                className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-[#113a3a]" />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-4">
            <button
              type="submit"
              disabled={loading}
              className={`flex-1 py-4 px-6 rounded-md text-white font-bold tracking-wide transition duration-200 ${
                loading ? 'bg-gray-400 cursor-not-allowed' : 
                editingId ? 'bg-blue-600 hover:bg-blue-700' : 'bg-[#113a3a] hover:bg-[#0d2e2e]'
              }`}
            >
              {loading ? 'Saving...' : editingId ? 'Update Entry' : 'Save Metrics'}
            </button>
            
            {editingId && (
              <button
                type="button"
                onClick={cancelEdit}
                className="px-6 py-4 rounded-md bg-gray-200 text-gray-700 font-bold hover:bg-gray-300 transition"
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      {/* --- SCROLLABLE TABLE --- */}
      <div className="bg-white shadow-lg rounded-lg overflow-hidden border border-gray-100">
        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
          <h2 className="text-lg font-semibold text-gray-700">Recent Entries Database</h2>
          <span className="text-xs text-gray-400 italic">Scroll horizontally to see all data →</span>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600 whitespace-nowrap">
            <thead className="bg-gray-100 text-gray-700 uppercase text-xs font-bold">
              <tr>
                <th className="px-6 py-3 min-w-[120px]">Date</th>
                <th className="px-6 py-3 min-w-[150px]">Brand</th>
                <th className="px-6 py-3">Web Visits</th>
                <th className="px-6 py-3 text-blue-800 bg-blue-50">LI Impress.</th>
                <th className="px-6 py-3 text-blue-800 bg-blue-50">LI Followers</th>
                <th className="px-6 py-3 text-pink-800 bg-pink-50">IG Views</th>
                <th className="px-6 py-3 text-pink-800 bg-pink-50">IG Followers</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {recentMetrics.length === 0 ? (
                <tr><td colSpan="8" className="px-6 py-8 text-center text-gray-400">No data found yet. Add some above!</td></tr>
              ) : (
                recentMetrics.map((item) => (
                  <tr key={item.id} className={`hover:bg-gray-50 transition ${editingId === item.id ? 'bg-blue-50' : ''}`}>
                    <td className="px-6 py-4 font-medium text-gray-900">{item.date}</td>
                    <td className="px-6 py-4 font-bold text-[#113a3a]">
                      {item.brands?.name || 'Unknown'}
                    </td>
                    <td className="px-6 py-4">{item.website_visits}</td>
                    <td className="px-6 py-4 bg-blue-50/50">{item.linkedin_impressions}</td>
                    <td className="px-6 py-4 bg-blue-50/50">{item.linkedin_followers}</td>
                    <td className="px-6 py-4 bg-pink-50/50">{item.instagram_views}</td>
                    <td className="px-6 py-4 bg-pink-50/50">{item.instagram_followers}</td>
                    <td className="px-6 py-4 text-right space-x-3">
                      <button 
                        onClick={() => handleEdit(item)}
                        className="text-blue-600 hover:text-blue-900 font-medium underline decoration-blue-200 hover:decoration-blue-900"
                      >
                        Edit
                      </button>
                      <button 
                        onClick={() => handleDelete(item.id)}
                        className="text-red-500 hover:text-red-700 font-medium hover:underline"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      
    </div>
  )
}