import React from "react";
import { Route, Routes, useLocation } from "react-router-dom";
import Login from "./pages/Login";
import CreatePost from "./pages/CreatePost";
import Feed from "./pages/Feed";
import Messages from "./pages/Messages";
import ChatBox from "./pages/ChatBox";
import Discover from "./pages/Discover";
import Connections from "./pages/Connections";
import Profile from "./pages/Profile";
import Layout from "./pages/Layout";
import { useUser, useAuth } from "@clerk/clerk-react";
import toast, { Toaster } from "react-hot-toast";
import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { fetchUser } from "./features/user/userSlice";
import { fetchConnections } from "./features/connections/connectionsSlice";
import { addMessages } from "./features/messages/messagesSlice";
import { useRef } from "react";

const App = () => {
  const { user } = useUser();
  const { getToken } = useAuth();
  const {pathname}=useLocation()
  const pathnameRef =useRef(pathname)
  const dispatch = useDispatch()


  useEffect(() => {
    const fetchData = async () => {
      if (user) {
        const token = await getToken();
        dispatch(fetchUser (token));
        dispatch(fetchConnections(token))
        console.log(token)
      }
    };
    fetchData() 
    
  }, [user, getToken , dispatch]);


    useEffect(()=>{
      pathnameRef.current = pathname
    }, [pathname])
    
    useEffect(()=>{
      if (user){

        const eventSource = new EventSource(import.meta.env.VITE_BASEURL + '/api/message/' + user.id);


        eventSource.onmessage = (event)=>{
          const message = JSON.parse(event.data)

         if (pathnameRef.current === ('/messages/' + message.from_user_id._id)){
            dispatch(addMessages(message))
          } else {
            toast.custom((t)=>(
              <Notification t={t} message={message}/>
            ),{ position : "bottom-right"})

          }
        }

        return ()=>{
          eventSource.close()
        }
      }
    },[user, dispatch])


  return (
    <>
      <Toaster />
      <Routes>
        <Route path="/" element={!user ? <Login /> : <Layout />}>
          <Route index element={<Feed />} />
          <Route path="messages" element={<Messages />} />
          <Route path="messages/:userId" element={<ChatBox />} />
          <Route path="connections" element={<Connections />} />
          <Route path="discover" element={<Discover />} />
          <Route path="profile" element={<Profile />} />
          <Route path="profile/:profileId" element={<Profile />} />
          <Route path="create-post" element={<CreatePost />} />
        </Route>
      </Routes>
    </>
  );
};

export default App;
