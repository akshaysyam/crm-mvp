'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../../../lib/supabaseClient'

export default function UploadSocial() {
  const [brands, setBrands] = useState([])
  const [recentPosts, setRecentPosts] = useState([])
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })
  const [editingId, setEditingId] = useState(null)

  const PLATFORMS = ['Instagram', 'LinkedIn']

  // Form State - Added posted_date
  const [formData, setFormData] = useState({
    brand_id: '',
    platform: 'Instagram',
    posted_date: new Date().toISOString().split('T')[0], // Defaults to Today
    post_name: '',
    post_link: '',
    impressions_views: '',
    likes: '',
  })

  // 1. Load Data
  useEffect(() => {
    fetchBrands()
    fetchRecentPosts()
  }, [])

  const fetchBrands = async () => {
    const { data } = await supabase.from('brands').select('*')
    if (data) setBrands(data)
  }

  const fetchRecentPosts = async () => {
    // Order by posted_date so newest posts show first
    const { data, error } = await supabase
      .from('social_posts')
      .select(`*, brands (name)`)
      .order('posted_date', { ascending: false }) 
      .limit(20)

    if (data) setRecentPosts(data)
    if (error) console.error('Error fetching posts:', error)
  }

  // 2. Handle Inputs
  const handleChange = (e) => {
    const { name, value } = e.target
    if (name === 'impressions_views' || name === 'likes') {
      const val = value === '' ? '' : parseInt(value)
      setFormData({ ...formData, [name]: val })
    } else {
      setFormData({ ...formData, [name]: value })
    }
  }

  // 3. Edit Mode
  const handleEdit = (item) => {
    setEditingId(item.id)
    setFormData({
      brand_id: item.brand_id,
      platform: item.platform,
      posted_date: item.posted_date || new Date().toISOString().split('T')[0],
      post_name: item.post_name || '',
      post_link: item.post_link || '',
      impressions_views: item.impressions_views,
      likes: item.likes,
    })
    window.scrollTo({ top: 0, behavior: 'smooth' })
    setMessage({ type: 'info', text: 'Editing post stats. Update values below.' })
  }

  const cancelEdit = () => {
    setEditingId(null)
    setFormData({
      brand_id: '',
      platform: 'Instagram',
      posted_date: new Date().toISOString().split('T')[0],
      post_name: '',
      post_link: '',
      impressions_views: '',
      likes: '',
    })
    setMessage({ type: '', text: '' })
  }

  // 4. Delete
  const handleDelete = async (id) => {
    if (!confirm('Delete this post record?')) return
    const { error } = await supabase.from('social_posts').delete().eq('id', id)
    if (error) alert(error.message)
    else {
      fetchRecentPosts()
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
      impressions_views: formData.impressions_views || 0,
      likes: formData.likes || 0,
    }

    let error;
    if (editingId) {
      const res = await supabase.from('social_posts').update(payload).eq('id', editingId)
      error = res.error
    } else {
      const res = await supabase.from('social_posts').insert([payload])
      error = res.error
    }

    if (error) {
      setMessage({ type: 'error', text: 'Error: ' + error.message })
    } else {
      setMessage({ type: 'success', text: editingId ? 'Post updated!' : 'Post tracked successfully!' })
      fetchRecentPosts()
      if (editingId) cancelEdit()
      else {
        // Reset inputs but keep Brand/Platform/Date for faster entry
        setFormData(prev => ({ 
          ...prev, 
          post_name: '', 
          post_link: '', 
          impressions_views: '', 
          likes: '' 
        }))
      }
    }
    setLoading(false)
  }

  return (
    <div className="max-w-[95%] mx-auto pb-12">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">
        {editingId ? 'Edit Social Post' : 'Track Social Post'}
      </h1>

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
          {/* Row 1: Date, Brand, Platform */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
             <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date Posted</label>
              <input
                type="date"
                name="posted_date"
                value={formData.posted_date}
                onChange={handleChange}
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#113a3a]"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Select Brand</label>
              <select
                name="brand_id"
                value={formData.brand_id}
                onChange={handleChange}
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#113a3a]"
              >
                <option value="">-- Choose Brand --</option>
                {brands.map((brand) => (
                  <option key={brand.id} value={brand.id}>{brand.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Platform</label>
              <select
                name="platform"
                value={formData.platform}
                onChange={handleChange}
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#113a3a]"
              >
                {PLATFORMS.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Row 2: Post Name & Link */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Post Name / Description</label>
              <input
                type="text"
                name="post_name"
                value={formData.post_name}
                onChange={handleChange}
                placeholder="e.g. Launch Video Reel"
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#113a3a]"
              />
            </div>
             <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Link to Post</label>
              <input
                type="text"
                name="post_link"
                value={formData.post_link}
                onChange={handleChange}
                placeholder="https://..."
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#113a3a]"
              />
            </div>
          </div>

          <div className="border-t border-gray-100 my-4"></div>

          {/* Row 3: Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Impressions / Views</label>
              <input
                type="number"
                name="impressions_views"
                value={formData.impressions_views}
                onChange={handleChange}
                placeholder="0"
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#113a3a]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Likes</label>
              <input
                type="number"
                name="likes"
                value={formData.likes}
                onChange={handleChange}
                placeholder="0"
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#113a3a]"
              />
            </div>
          </div>

          {/* Buttons */}
          <div className="flex items-center gap-4 pt-2">
            <button
              type="submit"
              disabled={loading}
              className={`flex-1 py-4 px-6 rounded-md text-white font-bold tracking-wide transition duration-200 ${
                loading ? 'bg-gray-400 cursor-not-allowed' : 
                editingId ? 'bg-blue-600 hover:bg-blue-700' : 'bg-[#113a3a] hover:bg-[#0d2e2e]'
              }`}
            >
              {loading ? 'Saving...' : editingId ? 'Update Post' : 'Save Post Stats'}
            </button>
            {editingId && (
              <button type="button" onClick={cancelEdit} className="px-6 py-4 rounded-md bg-gray-200 text-gray-700 font-bold hover:bg-gray-300">
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      {/* --- TABLE --- */}
      <div className="bg-white shadow-lg rounded-lg overflow-hidden border border-gray-100">
        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
          <h2 className="text-lg font-semibold text-gray-700">Recent Posts Tracker</h2>
          <span className="text-xs text-gray-400 italic">Scroll →</span>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600 whitespace-nowrap">
            <thead className="bg-gray-100 text-gray-700 uppercase text-xs font-bold">
              <tr>
                <th className="px-6 py-3">Date Posted</th>
                <th className="px-6 py-3">Brand</th>
                <th className="px-6 py-3">Platform</th>
                <th className="px-6 py-3">Post Name</th>
                <th className="px-6 py-3 text-blue-800 bg-blue-50">Views</th>
                <th className="px-6 py-3 text-pink-800 bg-pink-50">Likes</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {recentPosts.length === 0 ? (
                <tr><td colSpan="7" className="px-6 py-8 text-center text-gray-400">No posts tracked yet.</td></tr>
              ) : (
                recentPosts.map((item) => (
                  <tr key={item.id} className={`hover:bg-gray-50 transition ${editingId === item.id ? 'bg-blue-50' : ''}`}>
                    <td className="px-6 py-4 font-medium">{item.posted_date}</td>
                    <td className="px-6 py-4 font-bold text-[#113a3a]">{item.brands?.name || 'Unknown'}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded text-xs font-bold ${
                        item.platform === 'LinkedIn' ? 'bg-blue-100 text-blue-800' : 'bg-pink-100 text-pink-800'
                      }`}>
                        {item.platform}
                      </span>
                    </td>
                    <td className="px-6 py-4 max-w-[200px] truncate">
                      {item.post_link ? (
                         <a href={item.post_link} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline font-medium">
                           {item.post_name || 'Link'}
                         </a>
                      ) : (
                        <span className="text-gray-500">{item.post_name || '-'}</span>
                      )}
                    </td>
                    <td className="px-6 py-4 bg-blue-50/50 font-mono">{item.impressions_views?.toLocaleString()}</td>
                    <td className="px-6 py-4 bg-pink-50/50 font-mono">{item.likes?.toLocaleString()}</td>
                    <td className="px-6 py-4 text-right space-x-3">
                      <button onClick={() => handleEdit(item)} className="text-blue-600 hover:text-blue-900 font-medium underline">Edit</button>
                      <button onClick={() => handleDelete(item.id)} className="text-red-500 hover:text-red-700 font-medium hover:underline">Delete</button>
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