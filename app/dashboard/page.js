'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabaseClient' 

export default function DashboardHome() {
  const [brands, setBrands] = useState([])
  const [metricsStats, setMetricsStats] = useState({})
  const [blogs, setBlogs] = useState({})
  const [posts, setPosts] = useState({})
  const [loading, setLoading] = useState(true)

  const BRAND_COLORS = {
    'TruEstate': 'text-blue-700',
    'Canvas Homes': 'text-purple-700',
    'ACN': 'text-red-700',
    'Vault': 'text-emerald-700'
  }

  useEffect(() => {
    fetchData()
  }, [])

  const getChange = (current, previous) => {
    if (!previous) return 0;
    if (current === previous) return 0;
    return Math.round(((current - previous) / previous) * 100);
  }

  const fetchData = async () => {
    setLoading(true)

    // 1. Brands
    const { data: brandData } = await supabase.from('brands').select('*')
    const mergedBrands = brandData?.map(b => ({
      ...b,
      color: BRAND_COLORS[b.name] || 'text-gray-700'
    })) || []
    setBrands(mergedBrands)

    // 2. Metrics
    const { data: allMetrics } = await supabase
      .from('daily_metrics')
      .select('*')
      .order('date', { ascending: false })

    const statsMap = {}
    mergedBrands.forEach(brand => {
      const brandMetrics = allMetrics?.filter(m => m.brand_id === brand.id) || []
      const current = brandMetrics[0] || {}
      const previous = brandMetrics[1] || {}

      statsMap[brand.id] = {
        website_visits: current.website_visits || 0,
        linkedin_impressions: current.linkedin_impressions || 0,
        linkedin_followers: current.linkedin_followers || 0,
        instagram_views: current.instagram_views || 0,
        instagram_followers: current.instagram_followers || 0,
        website_change: getChange(current.website_visits, previous.website_visits),
        linkedin_imp_change: getChange(current.linkedin_impressions, previous.linkedin_impressions),
        linkedin_fol_change: getChange(current.linkedin_followers, previous.linkedin_followers),
        insta_view_change: getChange(current.instagram_views, previous.instagram_views),
        insta_fol_change: getChange(current.instagram_followers, previous.instagram_followers),
      }
    })
    setMetricsStats(statsMap)

    // 3. Blogs
    const { data: allBlogs } = await supabase.from('blogs').select('*').order('views', { ascending: false })
    const blogMap = {}
    allBlogs?.forEach(b => {
      if (!blogMap[b.brand_id]) blogMap[b.brand_id] = []
      if (blogMap[b.brand_id].length < 5) blogMap[b.brand_id].push(b)
    })
    setBlogs(blogMap)

    // 4. Social Posts
    const { data: allPosts } = await supabase.from('social_posts').select('*').order('impressions_views', { ascending: false })
    const postMap = {}
    allPosts?.forEach(p => {
      if (!postMap[p.brand_id]) postMap[p.brand_id] = []
      if (postMap[p.brand_id].length < 5) postMap[p.brand_id].push(p)
    })
    setPosts(postMap)

    setLoading(false)
  }

  // --- HELPER FOR BADGE ---
  const getHealthBadge = (score) => {
    if (score === null || score === undefined) return <span className="text-gray-300 text-xs">-</span>
    let colorClass = '', label = ''
    if (score <= 20) { colorClass = 'bg-green-100 text-green-700'; label = 'Healthy' }
    else if (score <= 50) { colorClass = 'bg-orange-100 text-orange-700'; label = 'Moderate' }
    else { colorClass = 'bg-red-100 text-red-700'; label = 'High AI' }
    
    return (
      <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${colorClass}`}>
        {label} {score}%
      </span>
    )
  }

  // --- COMPONENTS ---

  const MetricCard = ({ brand, value, change }) => {
    const isPositive = change >= 0
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.1)] hover:shadow-lg transition-all duration-300 group">
        <div className="flex justify-between items-center mb-3">
          <div className={`font-extrabold text-lg tracking-tight ${brand.color}`}>
            {brand.name}
          </div>
          <span className="text-[10px] font-medium border border-slate-200 rounded-md px-2 py-1 text-slate-400 bg-slate-50">Latest</span>
        </div>
        <div className="text-center mt-4 pb-1">
          <div className="text-3xl font-bold text-slate-800 tracking-tight">
            {value ? value.toLocaleString() : '0'}
          </div>
          <div className={`text-xs font-bold mt-1 inline-flex items-center gap-1 px-2 py-0.5 rounded-full ${isPositive ? 'text-emerald-700 bg-emerald-50' : 'text-red-700 bg-red-50'}`}>
            {isPositive ? '↑' : '↓'} {Math.abs(change)}%
          </div>
        </div>
      </div>
    )
  }

  const SocialCard = ({ brand, label1, val1, change1, label2, val2, change2 }) => (
    <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.1)] hover:shadow-lg transition-all duration-300 group">
      <div className="flex justify-between items-center mb-4">
        <div className={`font-bold text-base tracking-tight ${brand.color}`}>
          {brand.name}
        </div>
        <span className="text-[10px] font-medium border border-slate-200 rounded px-2 py-1 text-slate-400 bg-slate-50">Current</span>
      </div>
      <div className="space-y-3">
        <div className="flex justify-between items-center text-sm border-b border-dashed border-slate-100 pb-2">
          <span className="text-slate-500 text-xs font-medium uppercase">{label1}</span>
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-800 text-lg">{val1 ? val1.toLocaleString() : '0'}</span>
            <span className={`text-[10px] font-bold px-1 rounded ${change1 >= 0 ? 'text-emerald-600 bg-emerald-50' : 'text-red-600 bg-red-50'}`}>
              {change1 >= 0 ? '+' : ''}{change1}%
            </span>
          </div>
        </div>
        <div className="flex justify-between items-center text-sm pt-1">
          <span className="text-slate-500 text-xs font-medium uppercase">{label2}</span>
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-800 text-lg">{val2 ? val2.toLocaleString() : '0'}</span>
            <span className={`text-[10px] font-bold px-1 rounded ${change2 >= 0 ? 'text-emerald-600 bg-emerald-50' : 'text-red-600 bg-red-50'}`}>
              {change2 >= 0 ? '+' : ''}{change2}%
            </span>
          </div>
        </div>
      </div>
    </div>
  );

  const ContentTable = ({ brand, title, columns, data, type }) => (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow h-full">
      <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-gray-50/50">
        <div className={`font-bold text-sm ${brand.color}`}>
          {brand.name}
        </div>
        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{title}</span>
      </div>
      <table className="w-full text-sm text-left">
        <thead>
          <tr className="border-b border-slate-200">
            {columns.map((col, i) => (
              <th key={i} className={`px-5 py-3 text-xs font-bold text-slate-500 uppercase tracking-wide ${i > 0 ? 'text-right' : ''} ${i === 0 ? 'w-1/2' : ''}`}>{col}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          {(!data || data.length === 0) ? (
            <tr><td colSpan={columns.length} className="px-5 py-4 text-center text-gray-400 text-xs italic">No data found</td></tr>
          ) : (
            data.map((row, i) => (
              <tr key={i} className="hover:bg-slate-50/80 transition-colors">
                {type === 'blog' ? (
                  <>
                    <td className="px-5 py-3.5 font-medium text-slate-700 truncate max-w-[200px]">{row.title}</td>
                    <td className="px-5 py-3.5 text-right text-slate-600 font-mono">{row.views?.toLocaleString()}</td>
                    {/* NEW: Health Badge */}
                    <td className="px-5 py-3.5 text-right">{getHealthBadge(row.ai_detection_score)}</td>
                  </>
                ) : (
                  <>
                    <td className="px-5 py-3.5 font-medium text-slate-700 truncate max-w-[200px]">{row.post_name || 'Untitled'}</td>
                    <td className="px-5 py-3.5 text-right text-slate-600 font-mono">{row.impressions_views?.toLocaleString()}</td>
                    <td className="px-5 py-3.5 text-right text-slate-600 font-mono">{row.likes?.toLocaleString()}</td>
                  </>
                )}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );

  if (loading) return <div className="p-10 text-center text-gray-400">Loading your dashboard...</div>

  return (
    <div className="space-y-10 pb-12">
      <div className="flex flex-col items-center justify-center py-6">
        <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">IQOL Marketing Dashboard</h2>
        <p className="text-slate-400 text-sm mt-1">Real-time content & performance tracking</p>
      </div>

      <section>
        <h3 className="text-sm font-bold text-slate-400 mb-4 uppercase tracking-widest border-b border-slate-200 pb-2">Website Visits (Today)</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {brands.map((b) => (
            <MetricCard key={b.id} brand={b} value={metricsStats[b.id]?.website_visits} change={metricsStats[b.id]?.website_change} />
          ))}
        </div>
      </section>

      <section>
        <h3 className="text-sm font-bold text-slate-400 mb-4 uppercase tracking-widest border-b border-slate-200 pb-2">LinkedIn Overview</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {brands.map((b) => (
            <SocialCard key={b.id} brand={b} label1="Impressions" val1={metricsStats[b.id]?.linkedin_impressions} change1={metricsStats[b.id]?.linkedin_imp_change} label2="Followers" val2={metricsStats[b.id]?.linkedin_followers} change2={metricsStats[b.id]?.linkedin_fol_change} />
          ))}
        </div>
      </section>

      <section>
        <h3 className="text-sm font-bold text-slate-400 mb-4 uppercase tracking-widest border-b border-slate-200 pb-2">Instagram Overview</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {brands.map((b) => (
            <SocialCard key={b.id} brand={b} label1="Profile Views" val1={metricsStats[b.id]?.instagram_views} change1={metricsStats[b.id]?.insta_view_change} label2="Followers" val2={metricsStats[b.id]?.instagram_followers} change2={metricsStats[b.id]?.insta_fol_change} />
          ))}
        </div>
      </section>

      {/* UPDATED BLOG SECTION WITH HEALTH BADGE */}
      <section>
        <h3 className="text-sm font-bold text-slate-400 mb-4 uppercase tracking-widest border-b border-slate-200 pb-2">Top Performing Blogs</h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
           {brands.map((b) => (
             <ContentTable 
               key={b.id} 
               brand={b} 
               title="Most Viewed Blogs" 
               // Added "Health" to columns
               columns={['Title', 'Visits', 'Health']} 
               data={blogs[b.id]} 
               type="blog"
             />
           ))}
        </div>
      </section>

      <section>
        <h3 className="text-sm font-bold text-slate-400 mb-4 uppercase tracking-widest border-b border-slate-200 pb-2">Top Social Content</h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
           {brands.map((b) => {
             const brandPosts = posts[b.id] || []
             const linkedinPosts = brandPosts.filter(p => p.platform === 'LinkedIn')
             const instaPosts = brandPosts.filter(p => p.platform === 'Instagram')
             return (
               <>
                 <ContentTable key={`${b.id}-li`} brand={b} title="Top LinkedIn Posts" columns={['Post', 'Imp', 'Likes']} data={linkedinPosts} type="social" />
                 <ContentTable key={`${b.id}-ig`} brand={b} title="Top Instagram Posts" columns={['Post', 'Views', 'Likes']} data={instaPosts} type="social" />
               </>
             )
           })}
        </div>
      </section>
    </div>
  );
}