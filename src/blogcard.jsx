import { useEffect, useState } from 'react'
import { supabase } from './database'
import CardFlip from '../components/CardFlip'
import { useNavigate } from 'react-router-dom' // if using react-router

export default function BlogList() {
  const [posts, setPosts] = useState([])
  const navigate = useNavigate()

  useEffect(() => {
    fetchPosts()
  }, [])

  async function fetchPosts() {
    const { data, error } = await supabase
      .from('posts')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) console.error('Error fetching posts:', error)
    else setPosts(data)
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
      {posts.map(post => (
        <CardFlip
          key={post.id}
          title={post.title}
          subtitle={post.subtitle}
          description={post.content?.slice(0, 100) + '...'}
          onReadMore={() => navigate(`/blog/${post.id}`)} // go to /blog/id
        />
      ))}
    </div>
  )
}