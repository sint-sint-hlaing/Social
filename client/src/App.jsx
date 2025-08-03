import React from 'react'
import { Route, Routes } from 'react-router-dom'
import Login from './pages/Login'
import CreatePost from './pages/CreatePost'
import Feed from './pages/Feed'
import Messages from './pages/Messages'
import ChatBox from './pages/ChatBox'
import Discover from './pages/Discover'
import Connections from './pages/Connections'
import Profile from './pages/Profile'
import Layout from './pages/Layout'
import { useUser } from '@clerk/clerk-react'

const App = () => {
  const user = useUser();
  return (
    <div>App</div>
  )
}

export default App