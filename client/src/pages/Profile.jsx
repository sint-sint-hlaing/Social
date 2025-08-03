import React from 'react'
import { dummyPostsData, dummyUserData } from '../assets/assets'

const Profile = () => {
  const {ProfileId}= useParams()
  const [user, setUser]= useState(null)
  const [posts, setPosts]= useState([])
  const [activeTab, setActiveTab]= useState('posts')
  const [showEdit, setShowEdit]= useState('false')

const fetchUser = async () => {
  setUser(dummyUserData)
  setPosts(dummyPostsData)
}
useEffect(()=>{
  fetchUser()
},[])
  return user ? (
    <div className='relative h-full overflow-y-scroll bg-gray-50 p-6'>

    </div>
  ) :(<loading />)
}

export default Profile